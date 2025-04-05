package com.example.sumy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Profile;

@SpringBootApplication
@Profile("dev")
public class SumyApplication {

	public static void main(String[] args) {
		SpringApplication.run(SumyApplication.class, args);
	}

}
