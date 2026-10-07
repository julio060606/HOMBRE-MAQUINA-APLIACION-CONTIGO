package com.sanpablo.contigo.repository;

import com.sanpablo.contigo.domain.clinical.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, String> {
}
