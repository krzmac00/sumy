// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      "app.title": "Student Authentication",
      "app.switchToLogin": "Login",
      "app.switchToRegister": "Register",

      // Login page
      "login.title": "Login",
      "login.email": "Email",
      "login.email.placeholder": "Enter your university email",
      "login.password": "Password",
      "login.password.placeholder": "Enter your password",
      "login.button": "Login",
      "login.loading": "Logging in...",
      "login.noAccount": "Don't have an account?",
      
      // Register page
      "register.title": "Register",
      "register.email": "Email",
      "register.email.placeholder": "123456@edu.p.lodz.pl or firstname.lastname@edu.p.lodz.pl",
      "register.emailHelp": "Use your university email (123456@edu.p.lodz.pl for students, firstname.lastname@edu.p.lodz.pl for lecturers)",
      "register.firstName": "First Name",
      "register.firstName.placeholder": "Enter your first name",
      "register.lastName": "Last Name",
      "register.lastName.placeholder": "Enter your last name",
      "register.password": "Password",
      "register.password.placeholder": "Enter your password",
      "register.confirmPassword": "Confirm Password",
      "register.confirmPassword.placeholder": "Confirm your password",
      "register.button": "Register",
      "register.registering": "Registering...",
      "register.haveAccount": "Already have an account?",
      "register.accountCreated": "Account created! Check your email to activate your account.",

      // Validation messages
      "validation.required": "{{field}} is required",
      "validation.email.format": "Email must be in format 123456@edu.p.lodz.pl (for students) or firstname.lastname@edu.p.lodz.pl (for lecturers)",
      "validation.password.length": "Password must be at least 8 characters",
      "validation.password.match": "Passwords do not match",

      // Success/Error messages
      "message.loginSuccess": "Welcome, {{name}}!",
      "message.loginError": "Invalid login credentials",
      "message.registerSuccess": "Registration successful! Please check your email to activate your account.",
      "message.emailExists": "Email already registered",
      "message.activation": "Account activation",
      "message.activationSuccess": "Your account has been activated successfully! You can now log in.",
      "message.activationError": "Failed to activate account. The activation link may be expired or invalid.",
      
      // Navigation
      "nav.home": "Home",
      "nav.newsfeed": "Newsfeed",
      "nav.map": "Map",
      "nav.calendar": "Calendar",
      "nav.timetable": "Timetable",
      
      // User menu
      "user.profile": "Profile",
      "user.settings": "Settings",
      "user.logout": "Logout",
      
      // Sidebar
      "sidebar.title": "Navigation",
      "sidebar.home": "Home",
      "sidebar.forum": "Forum",
      "sidebar.settings": "Settings",
      "sidebar.utilities": "Utilities",
      "sidebar.forum.title": "Forum",
      "sidebar.forum.allThreads": "All Threads",
      "sidebar.forum.createThread": "Create Thread",
      
      // Home page
      "home.welcome": "Welcome to Policonnect",
      "home.description": "This is a sample home page using the main layout template.",
      "home.features.title": "Features",
      "home.features.navbar": "Responsive navigation bar",
      "home.features.sidebar": "Toggleable sidebar",
      "home.features.i18n": "Internationalization support",
      "home.features.userMenu": "User settings dropdown",

      // Forum - General
      "forum.title": "Discussion Forum",
      "forum.description": "Engage with other students, ask questions, and share knowledge",
      "forum.loading": "Loading...",
      "forum.backToList": "Back to Thread List",
      "forum.error.title": "Error",
      "forum.error.fetchThreads": "Error loading threads. Please try again later.",
      "forum.error.fetchThread": "Error loading thread. Please try again later.",
      "forum.error.threadNotFound": "Thread not found.",
      
      // Forum - Thread List
      "forum.threadList.title": "Discussion Threads",
      "forum.threadList.createNew": "Create New Thread",
      "forum.threadList.by": "by",
      "forum.threadList.post": "post",
      "forum.threadList.posts": "posts",
      "forum.threadList.lastActivity": "Last activity",
      "forum.threadList.noThreads": "No threads found. Be the first to create one!",
      "forum.threadList.noThreadsInCategory": "No threads found in the '{{category}}' category.",
      "forum.filter.category": "Category",
      "forum.filter.allCategories": "All Categories",
      
      // Forum - Thread View
      "forum.thread.newReply": "New Reply",
      "forum.thread.replyToMultiple": "Reply to Multiple Posts",
      "forum.thread.cancelSelection": "Cancel Selection",
      "forum.thread.postsSelected": "posts selected",
      "forum.thread.replyToSelected": "Reply to Selected Posts",
      "forum.thread.selectPost": "Select this post",
      "forum.thread.reply": "reply",
      "forum.thread.replies": "replies",
      "forum.thread.noReplies": "No replies yet. Be the first to reply!",
      "forum.thread.visibleForTeachers": "Visible for Teachers",
      "forum.thread.canBeAnswered": "Can Be Answered",
      
      // Forum - Post
      "forum.post.edited": "Edited",
      "forum.post.reply": "Reply",
      "forum.post.edit": "Edit",
      "forum.post.delete": "Delete",
      "forum.post.confirmDelete": "Are you sure?",
      "forum.post.confirmYes": "Yes",
      "forum.post.confirmNo": "No",
      "forum.post.cancelEdit": "Cancel",
      "forum.post.saveEdit": "Save",
      "forum.post.errorEmptyContent": "Content cannot be empty",
      "forum.post.errorUpdate": "Error updating post",
      "forum.post.errorDelete": "Error deleting post",
      "forum.post.repliesTo": "Replying to:",
      "forum.post.reply_lc": "reply",
      "forum.post.replies": "replies",
      
      // Forum - Reply
      "forum.reply.title.withReplies": "Reply to {{count}} posts",
      "forum.reply.title.newPost": "Post a Reply",
      "forum.reply.replyingTo": "Replying to",
      "forum.reply.nickname": "Your Nickname",
      "forum.reply.nicknamePlaceholder": "Enter your nickname",
      "forum.reply.content": "Your Reply",
      "forum.reply.contentPlaceholder": "Enter your reply here...",
      "forum.reply.cancel": "Cancel",
      "forum.reply.submit": "Post Reply",
      "forum.reply.submitting": "Posting...",
      "forum.reply.errorNickname": "Nickname is required",
      "forum.reply.errorContent": "Reply content is required",
      "forum.reply.errorSubmit": "Error posting reply",
      
      // Forum - Create Thread
      "forum.create.title": "Create New Thread",
      "forum.create.threadTitle": "Thread Title",
      "forum.create.threadTitlePlaceholder": "Enter a descriptive title for your thread",
      "forum.create.category": "Category",
      "forum.create.selectCategory": "Select a category",
      "forum.create.content": "Thread Content",
      "forum.create.contentPlaceholder": "Describe your question or topic in detail...",
      "forum.create.nickname": "Your Nickname",
      "forum.create.nicknamePlaceholder": "Enter your nickname",
      "forum.create.visibleForTeachers": "Visible for teachers",
      "forum.create.canBeAnswered": "Allow replies to this thread",
      "forum.create.cancel": "Cancel",
      "forum.create.submit": "Create Thread",
      "forum.create.creating": "Creating...",
      "forum.create.error": "Error creating thread. Please try again.",
      "forum.create.validation.titleRequired": "Thread title is required",
      "forum.create.validation.titleLength": "Title must be at least 5 characters",
      "forum.create.validation.categoryRequired": "Please select a category",
      "forum.create.validation.contentRequired": "Thread content is required",
      "forum.create.validation.contentLength": "Content must be at least 10 characters",
      "forum.create.validation.nicknameRequired": "Nickname is required",
	  
	    //Calendar
      "calendar.enterClass": "Enter class title",
      "calendar.deleteClass": "Delete event '{{title}}'?",
      "calendar.previous": "Back",
      "calendar.next": "Next",
      "calendar.month": "Month",
      "calendar.week": "Week",
      "calendar.day": "Day",
      "calendar.category.important": "Important",
      "calendar.category.private": "Private",
      "calendar.category.club": "Science Club",
      "calendar.category.student_council": "Student Council",
      "calendar.category.tul_events": "TUL Events",
      "calendar.newEvent": "New event",
      "calendar.repeat.none": "Once",
      "calendar.repeat.weekly": "Weekly",
      "calendar.repeat.monthly": "Monthly"
    }
  },
  pl: {
    translation: {
      // Common
      "app.title": "Uwierzytelnianie Studenta",
      "app.switchToLogin": "Logowanie",
      "app.switchToRegister": "Rejestracja",

      // Login page
      "login.title": "Logowanie",
      "login.email": "Email",
      "login.email.placeholder": "Wprowadź swój email uniwersytecki",
      "login.password": "Hasło",
      "login.password.placeholder": "Wprowadź hasło",
      "login.button": "Zaloguj się",
      "login.loading": "Logowanie...",
      "login.noAccount": "Nie masz konta?",
      
      // Register page
      "register.title": "Rejestracja",
      "register.email": "Email",
      "register.email.placeholder": "123456@edu.p.lodz.pl lub imie.nazwisko@edu.p.lodz.pl",
      "register.emailHelp": "Użyj emaila uniwersyteckiego (123456@edu.p.lodz.pl dla studentów, imie.nazwisko@edu.p.lodz.pl dla wykładowców)",
      "register.firstName": "Imię",
      "register.firstName.placeholder": "Wprowadź swoje imię",
      "register.lastName": "Nazwisko",
      "register.lastName.placeholder": "Wprowadź swoje nazwisko",
      "register.password": "Hasło",
      "register.password.placeholder": "Wprowadź hasło",
      "register.confirmPassword": "Potwierdź hasło",
      "register.confirmPassword.placeholder": "Potwierdź hasło",
      "register.button": "Zarejestruj się",
      "register.registering": "Rejestrowanie...",
      "register.haveAccount": "Masz już konto?",
      "register.accountCreated": "Konto utworzone! Sprawdź swój email, aby je aktywować.",

      // Validation messages
      "validation.required": "Pole {{field}} jest wymagane",
      "validation.email.format": "Email musi być w formacie 123456@edu.p.lodz.pl (dla studentów) lub imie.nazwisko@edu.p.lodz.pl (dla wykładowców)",
      "validation.password.length": "Hasło musi mieć co najmniej 8 znaków",
      "validation.password.match": "Hasła nie są takie same",

      // Success/Error messages
      "message.loginSuccess": "Witaj, {{name}}!",
      "message.loginError": "Nieprawidłowe dane logowania",
      "message.registerSuccess": "Rejestracja zakończona pomyślnie! Sprawdź swoją skrzynkę email, aby aktywować konto.",
      "message.emailExists": "Email jest już zarejestrowany",
      "message.activation": "Aktywacja konta",
      "message.activationSuccess": "Twoje konto zostało pomyślnie aktywowane! Możesz się teraz zalogować.",
      "message.activationError": "Nie udało się aktywować konta. Link aktywacyjny może być wygasły lub nieprawidłowy.",
      
      // Navigation
      "nav.home": "Strona główna",
      "nav.newsfeed": "Aktualności",
      "nav.map": "Mapa",
      "nav.calendar": "Kalendarz",
      "nav.timetable": "Plan zajęć",
      
      // User menu
      "user.profile": "Profil",
      "user.settings": "Ustawienia",
      "user.logout": "Wyloguj",
      
      // Sidebar
      "sidebar.title": "Nawigacja",
      "sidebar.home": "Strona główna",
      "sidebar.forum": "Forum",
      "sidebar.settings": "Ustawienia",
      "sidebar.utilities": "Narzędzia",
      "sidebar.forum.title": "Forum",
      "sidebar.forum.allThreads": "Wszystkie wątki",
      "sidebar.forum.createThread": "Utwórz wątek",
      
      // Home page
      "home.welcome": "Witaj w Policonnect",
      "home.description": "To jest przykładowa strona główna korzystająca z głównego szablonu układu.",
      "home.features.title": "Funkcje",
      "home.features.navbar": "Responsywny pasek nawigacji",
      "home.features.sidebar": "Wysuwany pasek boczny",
      "home.features.i18n": "Wsparcie dla wielu języków",
      "home.features.userMenu": "Rozwijane menu użytkownika",

      // Forum - General
      "forum.title": "Forum Dyskusyjne",
      "forum.description": "Rozmawiaj z innymi studentami, zadawaj pytania i dziel się wiedzą",
      "forum.loading": "Ładowanie...",
      "forum.backToList": "Powrót do listy wątków",
      "forum.error.title": "Błąd",
      "forum.error.fetchThreads": "Błąd podczas ładowania wątków. Spróbuj ponownie później.",
      "forum.error.fetchThread": "Błąd podczas ładowania wątku. Spróbuj ponownie później.",
      "forum.error.threadNotFound": "Wątek nie został znaleziony.",
      
      // Forum - Thread List
      "forum.threadList.title": "Wątki dyskusyjne",
      "forum.threadList.createNew": "Utwórz nowy wątek",
      "forum.threadList.by": "autor",
      "forum.threadList.post": "post",
      "forum.threadList.posts": "posty",
      "forum.threadList.lastActivity": "Ostatnia aktywność",
      "forum.threadList.noThreads": "Nie znaleziono wątków. Bądź pierwszy i utwórz nowy!",
      "forum.threadList.noThreadsInCategory": "Nie znaleziono wątków w kategorii '{{category}}'.",
      "forum.filter.category": "Kategoria",
      "forum.filter.allCategories": "Wszystkie kategorie",
      
      // Forum - Thread View
      "forum.thread.newReply": "Nowa odpowiedź",
      "forum.thread.replyToMultiple": "Odpowiedz na kilka postów",
      "forum.thread.cancelSelection": "Anuluj wybór",
      "forum.thread.postsSelected": "wybranych postów",
      "forum.thread.replyToSelected": "Odpowiedz na wybrane posty",
      "forum.thread.selectPost": "Wybierz ten post",
      "forum.thread.reply": "odpowiedź",
      "forum.thread.replies": "odpowiedzi",
      "forum.thread.noReplies": "Brak odpowiedzi. Bądź pierwszy i odpowiedz!",
      "forum.thread.visibleForTeachers": "Widoczne dla nauczycieli",
      "forum.thread.canBeAnswered": "Można odpowiadać",
      
      // Forum - Post
      "forum.post.edited": "Edytowany",
      "forum.post.reply": "Odpowiedz",
      "forum.post.edit": "Edytuj",
      "forum.post.delete": "Usuń",
      "forum.post.confirmDelete": "Czy na pewno?",
      "forum.post.confirmYes": "Tak",
      "forum.post.confirmNo": "Nie",
      "forum.post.cancelEdit": "Anuluj",
      "forum.post.saveEdit": "Zapisz",
      "forum.post.errorEmptyContent": "Treść nie może być pusta",
      "forum.post.errorUpdate": "Błąd podczas aktualizacji posta",
      "forum.post.errorDelete": "Błąd podczas usuwania posta",
      "forum.post.repliesTo": "Odpowiedź na:",
      "forum.post.reply_lc": "odpowiedź",
      "forum.post.replies": "odpowiedzi",
      
      // Forum - Reply
      "forum.reply.title.withReplies": "Odpowiedź na {{count}} postów",
      "forum.reply.title.newPost": "Dodaj odpowiedź",
      "forum.reply.replyingTo": "Odpowiadasz na",
      "forum.reply.nickname": "Twój pseudonim",
      "forum.reply.nicknamePlaceholder": "Wpisz swój pseudonim",
      "forum.reply.content": "Twoja odpowiedź",
      "forum.reply.contentPlaceholder": "Wpisz swoją odpowiedź tutaj...",
      "forum.reply.cancel": "Anuluj",
      "forum.reply.submit": "Opublikuj odpowiedź",
      "forum.reply.submitting": "Publikowanie...",
      "forum.reply.errorNickname": "Pseudonim jest wymagany",
      "forum.reply.errorContent": "Treść odpowiedzi jest wymagana",
      "forum.reply.errorSubmit": "Błąd podczas publikowania odpowiedzi",
      
      // Forum - Create Thread
      "forum.create.title": "Utwórz nowy wątek",
      "forum.create.threadTitle": "Tytuł wątku",
      "forum.create.threadTitlePlaceholder": "Wpisz opisowy tytuł dla swojego wątku",
      "forum.create.category": "Kategoria",
      "forum.create.selectCategory": "Wybierz kategorię",
      "forum.create.content": "Treść wątku",
      "forum.create.contentPlaceholder": "Opisz swoje pytanie lub temat szczegółowo...",
      "forum.create.nickname": "Twój pseudonim",
      "forum.create.nicknamePlaceholder": "Wpisz swój pseudonim",
      "forum.create.visibleForTeachers": "Widoczne dla nauczycieli",
      "forum.create.canBeAnswered": "Zezwalaj na odpowiedzi w tym wątku",
      "forum.create.cancel": "Anuluj",
      "forum.create.submit": "Utwórz wątek",
      "forum.create.creating": "Tworzenie...",
      "forum.create.error": "Błąd podczas tworzenia wątku. Spróbuj ponownie.",
      "forum.create.validation.titleRequired": "Tytuł wątku jest wymagany",
      "forum.create.validation.titleLength": "Tytuł musi mieć co najmniej 5 znaków",
      "forum.create.validation.categoryRequired": "Wybierz kategorię",
      "forum.create.validation.contentRequired": "Treść wątku jest wymagana",
      "forum.create.validation.contentLength": "Treść musi mieć co najmniej 10 znaków",
      "forum.create.validation.nicknameRequired": "Pseudonim jest wymagany",
	  
	    //Calendar
      "calendar.enterClass": "Wprowadź tytuł zajęć",
      "calendar.deleteClass": "Usunąć wydarzenie '{{title}}'?",
      "calendar.previous": "Wstecz",
      "calendar.next": "Dalej",
      "calendar.month": "Miesiąc",
      "calendar.week": "Tydzień",
      "calendar.day": "Dzień",
      "calendar.category.important": "Ważne",
      "calendar.category.private": "Prywatne",
      "calendar.category.club": "Koło naukowe",
      "calendar.category.student_council": "Samorząd Studencki",
      "calendar.category.tul_events": "Wydarzenia PŁ",
      "calendar.newEvent": "Nowe wydarzenie",
      "calendar.repeat.none": "Jednorazowo",
      "calendar.repeat.weekly": "Co tydzień",
      "calendar.repeat.monthly": "Co miesiąc"
    }
  }
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    }
  });

export default i18n;