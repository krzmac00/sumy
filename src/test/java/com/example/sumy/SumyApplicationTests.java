package com.example.sumy;

import com.example.sumy.model.User;
import com.example.sumy.service.UserService;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Profile;
import org.springframework.test.annotation.DirtiesContext;

import static org.assertj.core.api.Assertions.assertThat;


@SpringBootTest(classes = SumyApplication.class)
@Profile("test")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class SumyApplicationTests {

	@Autowired
	private UserService userService;

	@Test
	void entityManagerTest() {
		User user = new User("user1", "XYZ123");
		userService.saveUser(user);
		User savedUser = userService.findUser(user.getId());
		assertThat(savedUser).isNotNull();
		assertThat(user.getId()).isEqualTo(savedUser.getId());
		assertThat(user.getUsername()).isEqualTo(savedUser.getUsername());
		assertThat(user.getPassword()).isEqualTo(savedUser.getPassword());
	}
}
