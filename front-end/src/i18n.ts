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
      "login.username": "Username",
      "login.username.placeholder": "Enter your student ID",
      "login.password": "Password",
      "login.password.placeholder": "Enter your password",
      "login.button": "Login",
      "login.noAccount": "Don't have an account?",
      
      // Register page
      "register.title": "Register",
      "register.email": "Email",
      "register.email.placeholder": "123456@edu.p.lodz.pl",
      "register.firstName": "First Name",
      "register.firstName.placeholder": "Enter your first name",
      "register.lastName": "Last Name",
      "register.lastName.placeholder": "Enter your last name",
      "register.password": "Password",
      "register.password.placeholder": "Enter your password",
      "register.confirmPassword": "Confirm Password",
      "register.confirmPassword.placeholder": "Confirm your password",
      "register.button": "Register",
      "register.haveAccount": "Already have an account?",

      // Validation messages
      "validation.required": "{{field}} is required",
      "validation.email.format": "Email must be in format XXXXXX@edu.p.lodz.pl where X is a number",
      "validation.password.length": "Password must be at least 6 characters",
      "validation.password.match": "Passwords do not match",

      // Success/Error messages
      "message.loginSuccess": "Welcome, {{name}}!",
      "message.loginError": "Invalid login credentials",
      "message.registerSuccess": "Registration successful! You can now login with your credentials.",
      "message.emailExists": "Email already registered",
      
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
      "forum.thread.visibleForTeachers": "Visible for Teachers Only",
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
      "forum.create.visibleForTeachers": "Visible for teachers only",
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
      "forum.create.validation.nicknameRequired": "Nickname is required"
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
      "login.username": "Nazwa użytkownika",
      "login.username.placeholder": "Wprowadź ID studenta",
      "login.password": "Hasło",
      "login.password.placeholder": "Wprowadź hasło",
      "login.button": "Zaloguj się",
      "login.noAccount": "Nie masz konta?",
      
      // Register page
      "register.title": "Rejestracja",
      "register.email": "Email",
      "register.email.placeholder": "123456@edu.p.lodz.pl",
      "register.firstName": "Imię",
      "register.firstName.placeholder": "Wprowadź swoje imię",
      "register.lastName": "Nazwisko",
      "register.lastName.placeholder": "Wprowadź swoje nazwisko",
      "register.password": "Hasło",
      "register.password.placeholder": "Wprowadź hasło",
      "register.confirmPassword": "Potwierdź hasło",
      "register.confirmPassword.placeholder": "Potwierdź hasło",
      "register.button": "Zarejestruj się",
      "register.haveAccount": "Masz już konto?",

      // Validation messages
      "validation.required": "Pole {{field}} jest wymagane",
      "validation.email.format": "Email musi być w formacie XXXXXX@edu.p.lodz.pl gdzie X to liczba",
      "validation.password.length": "Hasło musi mieć co najmniej 6 znaków",
      "validation.password.match": "Hasła nie są takie same",

      // Success/Error messages
      "message.loginSuccess": "Witaj, {{name}}!",
      "message.loginError": "Nieprawidłowe dane logowania",
      "message.registerSuccess": "Rejestracja zakończona pomyślnie! Możesz teraz zalogować się używając swoich danych.",
      "message.emailExists": "Email jest już zarejestrowany",
      
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
      "forum.thread.visibleForTeachers": "Widoczne tylko dla nauczycieli",
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
      "forum.create.visibleForTeachers": "Widoczne tylko dla nauczycieli",
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
      "forum.create.validation.nicknameRequired": "Pseudonim jest wymagany"
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