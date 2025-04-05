package com.example.sumy.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .authorizeHttpRequests(
                        authorizeRequests -> {
                            authorizeRequests.requestMatchers("/").permitAll();
                            authorizeRequests.anyRequest().authenticated();
                        }
                )
                .formLogin(l -> l.defaultSuccessUrl("/private"))
                .logout(l -> l.logoutSuccessUrl("/"))
                .build();
    }
}
