package com.sanpablo.contigo.service.clinical;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Collections;
import java.util.List;

/**
 * Conector de integración externa con HIS/EHR institucional.
 * Implementa el contrato acordado para el transporte y mapeo HTTP REST.
 * 
 * Dependencia explícita: Requiere endpoint de producción autorizado y clave de API institucional (mTLS o API Key).
 * En ausencia de credenciales autorizadas, rechaza la operación informando la falta de autorización.
 * Nunca simula conexión real ni declara conectividad sin acreditación.
 */
@Component("authorizedExternalClinicalProvider")
public class AuthorizedExternalClinicalProvider implements ClinicalProvider {

    private static final Logger log = LoggerFactory.getLogger(AuthorizedExternalClinicalProvider.class);

    private final String externalEndpoint;
    private final String apiKey;
    private final RestTemplate restTemplate;

    public AuthorizedExternalClinicalProvider(
            @Value("${contigo.clinical-provider.external-endpoint:}") String externalEndpoint,
            @Value("${contigo.clinical-provider.api-key:}") String apiKey,
            @Value("${contigo.clinical-provider.timeout-ms:5000}") int timeoutMs,
            RestTemplateBuilder restTemplateBuilder) {
        this.externalEndpoint = externalEndpoint != null ? externalEndpoint.trim() : "";
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(timeoutMs))
                .setReadTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }

    @Override
    public List<PrescriptionData> fetchPrescriptions(String externalPatientId) {
        ensureAuthorizedConfiguration();
        String url = externalEndpoint + "/patients/" + externalPatientId + "/prescriptions";
        try {
            HttpEntity<Void> entity = createAuthEntity();
            ResponseEntity<List<PrescriptionData>> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, new ParameterizedTypeReference<>() {});
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.error("Fallo al consultar recetas en proveedor clínico externo [url={}]: {}", url, e.getMessage());
            throw new IllegalStateException("Error de comunicación con el servicio clínico externo institucional: " + e.getMessage(), e);
        }
    }

    @Override
    public List<AppointmentData> fetchAppointments(String externalPatientId) {
        ensureAuthorizedConfiguration();
        String url = externalEndpoint + "/patients/" + externalPatientId + "/appointments";
        try {
            HttpEntity<Void> entity = createAuthEntity();
            ResponseEntity<List<AppointmentData>> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, new ParameterizedTypeReference<>() {});
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (RestClientException e) {
            log.error("Fallo al consultar citas en proveedor clínico externo [url={}]: {}", url, e.getMessage());
            throw new IllegalStateException("Error de comunicación con el servicio clínico externo institucional: " + e.getMessage(), e);
        }
    }

    @Override
    public ProfileData fetchProfile(String externalPatientId) {
        ensureAuthorizedConfiguration();
        String url = externalEndpoint + "/patients/" + externalPatientId + "/profile";
        try {
            HttpEntity<Void> entity = createAuthEntity();
            ResponseEntity<ProfileData> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, ProfileData.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.error("Fallo al consultar perfil en proveedor clínico externo [url={}]: {}", url, e.getMessage());
            throw new IllegalStateException("Error de comunicación con el servicio clínico externo institucional: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isLiveConnection() {
        return isConfigured();
    }

    private boolean isConfigured() {
        return !externalEndpoint.isBlank() && !apiKey.isBlank();
    }

    private void ensureAuthorizedConfiguration() {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Integración externa no autorizada: Se requiere definir el endpoint institucional ('contigo.clinical-provider.external-endpoint') y las credenciales autorizadas ('contigo.clinical-provider.api-key').");
        }
    }

    private HttpEntity<Void> createAuthEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        headers.set("X-Client-Application", "Contigo-SanPablo");
        return new HttpEntity<>(headers);
    }
}
