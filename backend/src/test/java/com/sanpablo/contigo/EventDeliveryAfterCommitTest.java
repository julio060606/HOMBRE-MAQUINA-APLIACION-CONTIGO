package com.sanpablo.contigo;

import com.sanpablo.contigo.dto.events.DomainEventDto;
import com.sanpablo.contigo.service.EventPublishingService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EventDeliveryAfterCommitTest {
    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void disconnectedClientCannotTurnCommittedOperationIntoFailure(boolean emitterAlreadyClosed) throws Exception {
        var service = new EventPublishingService();
        SseEmitter disconnected = mock(SseEmitter.class);
        SseEmitter healthy = mock(SseEmitter.class);
        if (emitterAlreadyClosed) doThrow(new IllegalStateException("ResponseBodyEmitter has already completed"))
                .when(disconnected).send(any(SseEmitter.SseEventBuilder.class));
        else doThrow(new IOException("Connection reset"))
                .when(disconnected).send(any(SseEmitter.SseEventBuilder.class));
        Map<String, CopyOnWriteArrayList<EventPublishingService.EmitterSubscription>> subscriptions = new ConcurrentHashMap<>();
        subscriptions.put("pat_001", new CopyOnWriteArrayList<>(java.util.List.of(
                new EventPublishingService.EmitterSubscription("closed-client", "pat_001", disconnected),
                new EventPublishingService.EmitterSubscription("active-client", "pat_001", healthy))));
        ReflectionTestUtils.setField(service, "subscriptions", subscriptions);
        var event = new DomainEventDto("event-1", "CLINICAL_DATA_UPDATED", "clinic_demo", "pat_001", null, "Actualización");

        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        try {
            service.publish(event);
            verifyNoInteractions(healthy, disconnected);
            // The persistence transaction has committed before delivery begins.
            for (TransactionSynchronization callback : TransactionSynchronizationManager.getSynchronizations()) {
                assertDoesNotThrow(callback::afterCommit);
            }
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
            TransactionSynchronizationManager.setActualTransactionActive(false);
        }
        verify(healthy).send(any(SseEmitter.SseEventBuilder.class));
        verify(disconnected).send(any(SseEmitter.SseEventBuilder.class));
        assertDoesNotThrow(() -> service.publish(event));
        verify(healthy, times(2)).send(any(SseEmitter.SseEventBuilder.class));
        verifyNoMoreInteractions(disconnected);
    }
}
