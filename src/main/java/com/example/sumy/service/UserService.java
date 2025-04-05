package com.example.sumy.service;

import com.example.sumy.model.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void saveUser(User user) {
        entityManager.persist(user);
    }

    @Transactional
    public User findUser(Long id) {
        return entityManager.find(User.class, id);
    }
}
