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
      "login.username.placeholder": "Enter your student ID (XXXXXX)",
      "login.password": "Password",
      "login.password.placeholder": "Enter your password",
      "login.button": "Login",
      "login.noAccount": "Don't have an account?",
      
      // Register page
      "register.title": "Register",
      "register.email": "Email",
      "register.email.placeholder": "XXXXXX@edu.p.lodz.pl (X = number)",
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
      "sidebar.item1": "Dashboard",
      "sidebar.item2": "Statistics",
      "sidebar.item3": "Search",
      "sidebar.item4": "Settings",
      
      // Home page
      "home.welcome": "Welcome to Policonnect",
      "home.description": "This is a sample home page using the main layout template.",
      "home.features.title": "Features",
      "home.features.navbar": "Responsive navigation bar",
      "home.features.sidebar": "Toggleable sidebar",
      "home.features.i18n": "Internationalization support",
      "home.features.userMenu": "User settings dropdown",

      //Calendar
      "calendar.enterClass": "Enter class title",
      "calendar.enterCategory": "Category key (e.g. 'exam')",
      "calendar.enterColor": "Color key (e.g. '#FF0000')",
      "calendar.deleteClass": "Delete class '{{title}}'?",
      "calendar.previous": "Back",
      "calendar.next": "Next",
      "calendar.month": "Month",
      "calendar.week": "Week",
      "calendar.day": "Day",
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
      "login.username.placeholder": "Wprowadź ID studenta (XXXXXX)",
      "login.password": "Hasło",
      "login.password.placeholder": "Wprowadź hasło",
      "login.button": "Zaloguj się",
      "login.noAccount": "Nie masz konta?",
      
      // Register page
      "register.title": "Rejestracja",
      "register.email": "Email",
      "register.email.placeholder": "XXXXXX@edu.p.lodz.pl (X = liczba)",
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
      "sidebar.item1": "Panel",
      "sidebar.item2": "Statystyki",
      "sidebar.item3": "Wyszukiwanie",
      "sidebar.item4": "Ustawienia",
      
      // Home page
      "home.welcome": "Witaj w Policonnect",
      "home.description": "To jest przykładowa strona główna korzystająca z głównego szablonu układu.",
      "home.features.title": "Funkcje",
      "home.features.navbar": "Responsywny pasek nawigacji",
      "home.features.sidebar": "Wysuwany pasek boczny",
      "home.features.i18n": "Wsparcie dla wielu języków",
      "home.features.userMenu": "Rozwijane menu użytkownika",

      //Calendar
      "calendar.enterClass": "Wprowadź tytuł zajęć",
      "calendar.enterCategory": "Klucz kategorii (np. 'exam')",
      "calendar.enterColor": "Klucz koloru (np. '#FF0000')",
      "calendar.deleteClass": "Usuń zajęcia '{{title}}'?",
      "calendar.previous": "Wstecz",
      "calendar.next": "Dalej",
      "calendar.month": "Miesiąc",
      "calendar.week": "Tydzień",
      "calendar.day": "Dzień",
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