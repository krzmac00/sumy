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
      
      // Common
      "common.retry": "Retry",
      "common.refresh": "Refresh",
      "common.underConstruction": "Under Construction",
      "common.underConstruction.message": "We're working hard to bring you something amazing. Check back soon!",
      "common.underConstruction.progress": "{{progress}}% Complete",
      
      // Register page
      "register.title": "Register",
      "register.email": "Email",
      "register.email.placeholder": "123456@edu.p.lodz.pl or firstname.lastname@p.lodz.pl",
      "register.emailHelp": "Use your university email (123456@edu.p.lodz.pl for students, firstname.lastname@p.lodz.pl for lecturers)",
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
      "validation.email.format": "Email must be in format 123456@edu.p.lodz.pl (for students) or firstname.lastname@p.lodz.pl (for lecturers)",
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
      "nav.search": "Search user...",
      
      // User menu
      "user.profile": "Profile",
      "user.settings": "Settings",
      "user.logout": "Logout",

      // Sidebar
      "sidebar.title": "Navigation",
      "sidebar.home": "Home",
      "sidebar.forum": "Forum",
      "sidebar.noticeboard": "Noticeboard",
      "sidebar.newsfeed": "Newsfeed",
      "sidebar.settings": "Settings",
      "sidebar.utilities": "Utilities",
      "sidebar.forum.title": "Forum",
      "sidebar.forum.allThreads": "All Threads",
      "sidebar.forum.createThread": "Create Thread",
      "sidebar.noticeboard.title": "Noticeboard",
      "sidebar.noticeboard.allThreads": "All Notices",
      "sidebar.noticeboard.createThread": "Create Notice",
      "sidebar.newsfeed.title": "Newsfeed",
      "sidebar.newsfeed.allThreads": "All News",
      "sidebar.newsfeed.createThread": "Create News",
      
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
      "forum.refresh": "Refresh threads",
      "forum.anonymous": "anonymous",
      "forum.error.title": "Error",
      "forum.error.fetchThreads": "Error loading threads. Please try again later.",
      "forum.error.fetchThread": "Error loading thread. Please try again later.",
      "forum.error.threadNotFound": "Thread not found.",
      "forum.blacklist_on": "Czarna lista wł:",
      "forum.blacklist_off": "Czarna lista wył:",
      "forum.disable_blacklist": "Wyłącz czarną listę",
      "forum.enable_blacklist": "Włącz czarną listę",
      
      // Forum - Thread List
      "forum.threadList.title": "Discussion Threads",
      "forum.threadList.createNew": "Create New Thread",
      "forum.threadList.by": "by",
      "forum.threadList.post": "post",
      "forum.threadList.posts": "posts",
      "forum.threadList.lastActivity": "Last activity",
      "forum.threadList.noThreads": "No threads found. Be the first to create one!",
      "forum.threadList.noThreadsInCategory": "No threads found in the '{{category}}' category.",
      "forum.threadList.showingFilteredCount": "Showing {{count}} of {{total}} threads in \"{{category}}\"",
      "forum.threadList.totalCount_one": "{{count}} thread",
      "forum.threadList.totalCount_other": "{{count}} threads",
      "forum.filter.category": "Category",
      "forum.filter.allCategories": "All Categories",
      "forum.filter.dateFrom": "From",
      "forum.filter.dateTo": "To",
      "forum.filter.clearDates": "Clear dates",
      "forum.filter.invalidDateRange": "From date must be before To date",

      // Thread Categories
      "categories.general": "General",
      "categories.exams": "Exams",
      "categories.assignments": "Assignments",
      "categories.materials": "Course Materials",
      "categories.courses": "Courses",
      "categories.lecturers": "Lecturers",
      "categories.events": "Events",
      "categories.technical": "Technical Issues",
      "categories.other": "Other",
      
      // Forum - Thread View
      "forum.thread.edit": "Edit",
      "forum.thread.delete": "Delete",
      "forum.thread.confirmDelete": "Are you sure?",
      "forum.thread.confirmYes": "Yes",
      "forum.thread.confirmNo": "No",
      "forum.thread.errorDelete": "Error deleting thread",
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
      "forum.reply.postAnonymously": "Post anonymously",
      "forum.reply.anonymousDescription": "Your real name will be hidden. Enter a nickname below.",
      "forum.reply.anonymousRequired": "Anonymous posting requires you to provide a nickname.",
      "forum.reply.content": "Your Reply",
      "forum.reply.contentPlaceholder": "Enter your reply here...",
      "forum.reply.cancel": "Cancel",
      "forum.reply.submit": "Post Reply",
      "forum.reply.submitting": "Posting...",
      "forum.reply.errorNickname": "Nickname is required for anonymous posting",
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
      "forum.create.postAnonymously": "Post anonymously",
      "forum.create.anonymousDescription": "Your real name will be hidden. Enter a nickname below.",
      "forum.create.anonymousRequired": "Anonymous posting requires you to provide a nickname.",
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
      "forum.create.validation.nicknameRequired": "Nickname is required for anonymous posting",

      // Time ago formatting
      "time.minutesAgo_one": "min ago",
      "time.minutesAgo_other": "mins ago",
      "time.hoursAgo_one": "hr ago",
      "time.hoursAgo_other": "hrs ago",
      "time.daysAgo_one": "day ago",
      "time.daysAgo_other": "days ago",
      "time.weeksAgo_one": "week ago",
      "time.weeksAgo_other": "weeks ago",
      "time.monthsAgo_one": "month ago",
      "time.monthsAgo_other": "months ago",
      "time.yearsAgo_one": "year ago",
      "time.yearsAgo_other": "years ago",
      
      // Thread card actions
      "forum.action.share": "Share",
      "forum.action.save": "Save",
      "forum.action.info": "More Info",
      "forum.action.upvote": "Upvote",
      "forum.action.downvote": "Downvote",

	    //Calendar
      "calendar.enterClass": "Enter class title",
      "calendar.deleteClass": "Delete event '{{title}}'?",
      "calendar.enterRoom": "Enter room",
      "calendar.enterTeacher": "Enter teacher",
      "calendar.previous": "Back",
      "calendar.next": "Next",
      "calendar.month": "Month",
      "calendar.week": "Week",
      "calendar.day": "Day",
      "calendar.category.important": "Important",
      "calendar.category.private": "Private",
      "calendar.category.exam": "Exam",
      "calendar.category.club": "Science Club",
      "calendar.category.student_council": "Student Council",
      "calendar.category.tul_events": "TUL Events",
      "calendar.category.timetable_lecture": "Lecture",
      "calendar.category.timetable_laboratory": "Laboratory",
      "calendar.category.timetable_tutorials": "Tutorials",
      "calendar.categoryShort.timetable_lecture": "LEC",
      "calendar.categoryShort.timetable_laboratory": "LAB",
      "calendar.categoryShort.timetable_tutorials": "TUT",
      "calendar.newEvent": "New event",
      "calendar.repeat.none": "Once",
      "calendar.repeat.weekly": "Weekly",
      "calendar.repeat.monthly": "Monthly",
      "calendar.startDate": "Start Date",
      "calendar.endDate": "End Date",
      "calendar.time": "Time",
      "calendar.cancel": "Cancel",
      "calendar.save": "Save",
      "calendar.invalidRange": "End date must be after start date",
      "calendar.room": "Room",
      "calendar.teacher": "Teacher",
      "calendar.choose": "Choose a schedule",
      "calendar.scheduleTitle": "Schedule title",
      "calendar.scheduleCreated": "New timetable created",
      "calendar.scheduleUpdated": "Schedule updated.",
      "calendar.scheduleDeleted": "Schedule deleted.",
      "calendar.deleteScheduleConfirm": "Are you sure you want to delete this schedule?",
      "calendar.create": "Create",
      "calendar.update": "Update title",
      "calendar.delete": "Delete",

      // Map Filter Panel
      "map.filter.mapFilters":        "Map Filters",
      "map.filter.buildingType":      "Building type",
      "map.filter.faculty":           "Faculty buildings",
      "map.filter.nonFaculty":        "Non-faculty buildings",
      "map.filter.generalAcademic":   "General academic buildings",
      "map.filter.administration":    "Administration",

      // Search bar
      "map.search.placeholder":       "Search building…",

      // Building Floor Modal
      "modal.close":                  "Close",
      "map.popup.goToWebsite":    "Go to website",
      "map.popup.buildingPlan":   "Building plan",

      "modal.roomDetails.title":  "Room details",
      "modal.roomDetails.name":   "Name",
      "modal.roomDetails.type":   "Room type",
      "modal.roomDetails.floor":  "Floor",
      "room.type.auditorium": "Auditorium",

      "floor.groundFloor":        "Ground floor",
      "floor.firstFloor":         "1st floor",
      "floor.secondFloor":        "2nd floor",
      "floor.thirdFloor":         "3rd floor",
      "floor.fourthFloor":        "4th floor",

      "modal.floorPlanTitle":         "Floor plan of {{building}}",

      "buildings": {
        "B9":  {
          "label":       "B9 Lodex",
          "description": "Faculty of Technical Physics, Computer Science and Applied Mathematics"
        },
        "B14": {
          "label":       "B14 Institute of Physics",
          "description": "Institute of Physics"
        },
        "B19": {
          "label":       "B19 CTI",
          "description": "Information Technology Centre"
        },
        "B24": {
          "label":       "B24 Language Centre",
          "description": "Language Centre of Lodz University of Technology"
        },
        "B28": {
          "label":       "B28 Sports Bay",
          "description": "Academic Sports and Educational Centre of Lodz University of Technology"
        },
        "B22": {
          "label":       "B22 Main Library",
          "description": "Main Library of Lodz University of Technology"
        },
        "C4": {
          "label":       "C4 Sports Centre",
          "description": "Sports Centre of Lodz University of Technologu"
        },
        "C17": {
          "label":       "SD VI",
          "description": "Student Dormitory VI"
        },
        "C5": {
          "label":       "SD VII",
          "description": "Student Dormitory VII"
        },
        "C11": {
          "label":       "SD IV",
          "description": "Student Dormitory IV"
        },
        "C12": {
          "label":       "SD III",
          "description": "Student Dormitory III"
        },
        "C13": {
          "label":       "SD II",
          "description": "Student Dormitory II"
        },
        "C14": {
          "label":       "SD I",
          "description": "Student Dormitory I"
        },
        "C15": {
          "label":       "SDS",
          "description": "Student Government Headquarters"
        },
        "E1": {
          "label":       "SD IX",
          "description": "Student Dormitory IX"
        },
        "F1": {
          "label":       "SD V",
          "description": "Student Dormitory V"
        },
        "B11": {
          "label":       "Dean’s Office",
          "description": "Dean’s Office of FT-CS-AM"
        }
      },

      "rooms": {
        "F2":  "Auditorium F2",
        "F3":  "Auditorium F3",
        "F4":  "Auditorium F4",
        "F5":  "Auditorium F5",
        "F6":  "Auditorium F6",
        "F7":  "Auditorium F7",
        "F8":  "Auditorium F8",
        "F9":  "Auditorium F9",
        "F10": "Auditorium F10",
        "S1":  "Cinema Room",
        "A1":  "Aula Major",
        "A3":  "Aula Minor",
        "A2":  "Arena Magica"
      },

      //UserProfile
      "profile.userProfile": "User profile",
      "profile.firstName": "First name:",
      "profile.lastName": "Last name:",
      "profile.indexNumber": "Index number:",
      "profile.editProfile": "Edit profile",
      "profile.blackListForum": "Forum blacklist",
      "profile.addBlacklistedCotent": "Add content to the blacklist",
      "profile.blacklistExample": "Phrases should be placed in quotation marks: \"First phrase\", \"Second phrase\", etc.",
      "profile.bio": "Profile bio",
      "profile.bioPlaceholder": "Add your bio",

      //UserProfileEdit
      "profile.edit.editProfile": "Edit profile",
      "profile.edit.changePassword": "Change password",
      "profile.edit.changePasswordCancel": "Cancel password change",
      "profile.edit.saveChanges": "Save changes",
      "profile.edit.oldPassword": "Current password:",
      "profile.edit.newPassword": "New password:",
      "profile.edit.repeatPassword": "Repeat password:",
      "profile.edit.cancel": "Cancel",
      "profile.edit.empty_names": "First and last name cannot be empty",
      "profile.edit.fill_both_passwords": "Fill both password fields",
      "profile.edit.password_len": "Password must be at least 6 characters long",
      "profile.edit.password_no_match": "Passwords do not match",
      "profile.edit.successful_update": "Data has been successfully updated",
      "profile.edit.unsuccessful_update": "Failed to update data",

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
      
      // Common
      "common.retry": "Ponów próbę",
      "common.refresh": "Odśwież",
      "common.underConstruction": "W budowie",
      "common.underConstruction.message": "Ciężko pracujemy, aby dostarczyć Ci coś niesamowitego. Wróć wkrótce!",
      "common.underConstruction.progress": "{{progress}}% Ukończono",
      
      // Register page
      "register.title": "Rejestracja",
      "register.email": "Email",
      "register.email.placeholder": "123456@edu.p.lodz.pl lub imie.nazwisko@p.lodz.pl",
      "register.emailHelp": "Użyj emaila uniwersyteckiego (123456@edu.p.lodz.pl dla studentów, imie.nazwisko@p.lodz.pl dla wykładowców)",
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
      "validation.email.format": "Email musi być w formacie 123456@edu.p.lodz.pl (dla studentów) lub imie.nazwisko@p.lodz.pl (dla wykładowców)",
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
      "nav.search": "Szukaj użytkownika...",
      
      // User menu
      "user.profile": "Profil",
      "user.settings": "Ustawienia",
      "user.logout": "Wyloguj",

      // Sidebar
      "sidebar.title": "Nawigacja",
      "sidebar.home": "Strona główna",
      "sidebar.forum": "Forum dyskusyjne",
      "sidebar.noticeboard": "Tablica ogłoszeń",
      "sidebar.newsfeed": "Aktualności",
      "sidebar.settings": "Ustawienia",
      "sidebar.utilities": "Narzędzia",
      "sidebar.forum.title": "Forum dyskusyjne",
      "sidebar.forum.allThreads": "Wszystkie wątki",
      "sidebar.forum.createThread": "Utwórz wątek",
      "sidebar.noticeboard.title": "Tablica ogłoszeń",
      "sidebar.noticeboard.allThreads": "Wszystkie ogłoszenia",
      "sidebar.noticeboard.createThread": "Utwórz ogłoszenie",
      "sidebar.newsfeed.title": "Aktualności",
      "sidebar.newsfeed.allThreads": "Wszystkie aktualności",
      "sidebar.newsfeed.createThread": "Utwórz aktualność",
      
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
      "forum.refresh": "Odśwież wątki",
      "forum.anonymous": "anonimowy",
      "forum.error.title": "Błąd",
      "forum.error.fetchThreads": "Błąd podczas ładowania wątków. Spróbuj ponownie później.",
      "forum.error.fetchThread": "Błąd podczas ładowania wątku. Spróbuj ponownie później.",
      "forum.error.threadNotFound": "Wątek nie został znaleziony.",
      "forum.blacklist_on": "Czarna lista wł:",
      "forum.blacklist_off": "Czarna lista wył:",
      
      // Forum - Thread List
      "forum.threadList.title": "Wątki dyskusyjne",
      "forum.threadList.createNew": "Utwórz nowy wątek",
      "forum.threadList.by": "autor",
      "forum.threadList.post": "post",
      "forum.threadList.posts": "posty",
      "forum.threadList.lastActivity": "Ostatnia aktywność",
      "forum.threadList.noThreads": "Nie znaleziono wątków. Bądź pierwszy i utwórz nowy!",
      "forum.threadList.noThreadsInCategory": "Nie znaleziono wątków w kategorii '{{category}}'.",
      "forum.threadList.showingFilteredCount": "Wyświetlanie {{count}} z {{total}} wątków w \"{{category}}\"",
      "forum.threadList.totalCount_one": "{{count}} wątek",
      "forum.threadList.totalCount_other": "{{count}} wątki",
      "forum.filter.category": "Kategoria",
      "forum.filter.allCategories": "Wszystkie kategorie",
      "forum.filter.dateFrom": "Od",
      "forum.filter.dateTo": "Do",
      "forum.filter.clearDates": "Wyczyść daty",
      "forum.filter.invalidDateRange": "Data początkowa musi być przed datą końcową",

      // Thread Categories
      "categories.general": "Ogólne",
      "categories.exams": "Zaliczenia",
      "categories.assignments": "Zadania",
      "categories.materials": "Notatki",
      "categories.courses": "Przedmioty",
      "categories.lecturers": "Prowadzący",
      "categories.events": "Wydarzenia",
      "categories.technical": "Problemy techniczne",
      "categories.other": "Inne",
      
      // Forum - Thread View
      "forum.thread.edit": "Edytuj",
      "forum.thread.delete": "Usuń",
      "forum.thread.confirmDelete": "Czy na pewno?",
      "forum.thread.confirmYes": "Tak",
      "forum.thread.confirmNo": "Nie",
      "forum.thread.errorDelete": "Błąd podczas usuwania wątku",
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
      "forum.reply.postAnonymously": "Opublikuj anonimowo",
      "forum.reply.anonymousDescription": "Twoje prawdziwe imię zostanie ukryte. Wpisz pseudonim poniżej.",
      "forum.reply.anonymousRequired": "Anonimowe publikowanie wymaga podania pseudonimu.",
      "forum.reply.content": "Twoja odpowiedź",
      "forum.reply.contentPlaceholder": "Wpisz swoją odpowiedź tutaj...",
      "forum.reply.cancel": "Anuluj",
      "forum.reply.submit": "Opublikuj odpowiedź",
      "forum.reply.submitting": "Publikowanie...",
      "forum.reply.errorNickname": "Pseudonim jest wymagany dla anonimowych postów",
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
      "forum.create.postAnonymously": "Opublikuj anonimowo",
      "forum.create.anonymousDescription": "Twoje prawdziwe imię zostanie ukryte. Wpisz pseudonim poniżej.",
      "forum.create.anonymousRequired": "Anonimowe publikowanie wymaga podania pseudonimu.",
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
      "forum.create.validation.nicknameRequired": "Pseudonim jest wymagany dla anonimowych postów",
      
      // Time ago formatting
      "time.minutesAgo_one": "min temu",
      "time.minutesAgo_other": "min temu",
      "time.hoursAgo_one": "godz temu",
      "time.hoursAgo_other": "godz temu",
      "time.daysAgo_one": "dzień temu",
      "time.daysAgo_other": "dni temu",
      "time.weeksAgo_one": "tydzień temu",
      "time.weeksAgo_other": "tygodni temu",
      "time.monthsAgo_one": "miesiąc temu",
      "time.monthsAgo_other": "miesięcy temu",
      "time.yearsAgo_one": "rok temu",
      "time.yearsAgo_other": "lat temu",
      
      // Thread card actions
      "forum.action.share": "Udostępnij",
      "forum.action.save": "Zapisz",
      "forum.action.info": "Więcej Informacji",
      "forum.action.upvote": "Głosuj za",
      "forum.action.downvote": "Głosuj przeciw",
	  
	    //Calendar
      "calendar.enterClass": "Wprowadź tytuł zajęć",
      "calendar.deleteClass": "Usunąć wydarzenie '{{title}}'?",
      "calendar.enterRoom": "Wprowadź pomieszczenie",
      "calendar.enterTeacher": "Wprowadź nauczyciela",
      "calendar.previous": "Wstecz",
      "calendar.next": "Dalej",
      "calendar.month": "Miesiąc",
      "calendar.week": "Tydzień",
      "calendar.day": "Dzień",
      "calendar.category.important": "Ważne",
      "calendar.category.private": "Prywatne",
      "calendar.category.exam": "Egzamin",
      "calendar.category.club": "Koło naukowe",
      "calendar.category.student_council": "Samorząd Studencki",
      "calendar.category.tul_events": "Wydarzenia PŁ",
      "calendar.category.timetable_lecture": "Wykład",
      "calendar.category.timetable_laboratory": "Laboratorium",
      "calendar.category.timetable_tutorials": "Ćwiczenia",
      "calendar.categoryShort.timetable_lecture": "WYK",
      "calendar.categoryShort.timetable_laboratory": "LAB",
      "calendar.categoryShort.timetable_tutorials": "ĆW",
      "calendar.newEvent": "Nowe wydarzenie",
      "calendar.repeat.none": "Jednorazowo",
      "calendar.repeat.weekly": "Co tydzień",
      "calendar.repeat.monthly": "Co miesiąc",
      "calendar.startDate": "Data Początkowa",
      "calendar.endDate": "Data Końcowa",
      "calendar.time": "Czas",
      "calendar.cancel": "Anuluj",
      "calendar.save": "Zapisz",
      "calendar.invalidRange": "Data końcowa musi być później niż data początkowa",
      "calendar.room": "Pomieszczenie",
      "calendar.teacher": "Nauczyciel",
      "calendar.choose": "Wybierz plan",
      "calendar.scheduleTitle": "Tytuł planu",
      "calendar.scheduleCreated": "Utworzono nowy plan",
      "calendar.scheduleUpdated": "Zaktualizowano plan",
      "calendar.scheduleDeleted": "Plan został usunięty",
      "calendar.deleteScheduleConfirm": "Czy na pewno chcesz usunąć ten plan?",
      "calendar.create": "Utwórz",
      "calendar.update": "Aktualizuj tytuł",
      "calendar.delete": "Usuń",

      //MapFilterPanel
      "map.filter.mapFilters": "Filtry mapy",
      "map.filter.buildingType": "Typ budynku:",
      "map.filter.generalAcademic": "Ogólnouczelniane",
      "map.filter.faculty": "Wydziałowy",
      "map.filter.nonFaculty": "Pozawydziałowy",
      "map.filter.administration": "Administracja",

      "map.search.placeholder":   "Szukaj budynku…",

      "map.popup.goToWebsite":    "Przejdź do strony",
      "map.popup.buildingPlan":   "Plan budynku",

      "modal.roomDetails.title":  "Szczegóły sali",
      "modal.roomDetails.name":   "Nazwa",
      "modal.roomDetails.type":   "Typ sali",
      "modal.roomDetails.floor":  "Piętro",

      "room.type.auditorium": "Aula",

      "floor.groundFloor":        "Parter",
      "floor.firstFloor":         "Piętro 1",
      "floor.secondFloor":        "Piętro 2",
      "floor.thirdFloor":         "Piętro 3",
      "floor.fourthFloor":        "Piętro 4",

      "modal.floorPlanTitle":         "Plan budynku {{building}}",

      "buildings": {
        "B9":  {
          "label":       "B9 Lodex",
          "description": "Wydział Fizyki Technicznej, Informatyki i Matematyki Stosowanej"
        },
        "B14": {
          "label":       "B14 Instytut Fizyki",
          "description": "Instytut Fizyki"
        },
        "B19": {
          "label":       "B19 Centrum Technologii Informatycznych CTI",
          "description": "Centrum Technologii Informatycznych CTI"
        },
        "B24": {
          "label":       "B24 Centrum Językowe",
          "description": "Centrum Językowe Politechniki Łódzkiej"
        },
        "B28": {
          "label":       "B28 Zatoka Sportu",
          "description": "Akademickie Centrum Sportowo-Dydaktyczne Politechniki Łódzkiej"
        },
        "B22": {
          "label":       "B22 Biblioteka Główna",
          "description": "Biblioteka Główna Politechniki Łódzkiej"
        },
        "C4": {
          "label":       "C4 Centrum Sportu",
          "description": "Centrum Sportu Politechniki Łódzkiej"
        },
        "C17": {
          "label":       "VI DS",
          "description": "VI Dom Studencki"
        },
        "C5": {
          "label":       "VII DS",
          "description": "VII Dom Studencki"
        },
        "C11": {
          "label":       "IV DS",
          "description": "IV Dom Studencki"
        },
        "C12": {
          "label":       "III DS",
          "description": "III Dom Studencki"
        },
        "C13": {
          "label":       "II DS",
          "description": "II Dom Studencki"
        },
        "C14": {
          "label":       "I DS",
          "description": "I Dom Studencki"
        },
        "C15": {
          "label":       "SDS",
          "description": "Siedziba Samorządu Studenckiego"
        },
        "E1": {
          "label":       "IX DS",
          "description": "IX Dom Studencki"
        },
        "F1": {
          "label":       "V DS",
          "description": "V Dom Studencki"
        },
        "B11": {
          "label":       "Dziekanat WFTiMS",
          "description": "Dziekanat WFTiMS"
        }
      },

      "rooms": {
        "F2":  "Aula F2",
        "F3":  "Aula F3",
        "F4":  "Aula F4",
        "F5":  "Aula F5",
        "F6":  "Aula F6",
        "F7":  "Aula F7",
        "F8":  "Aula F8",
        "F9":  "Aula F9",
        "F10": "Aula F10",
        "S1":  "Sala kinowa",
        "A1":  "Aula Major",
        "A3":  "Aula Minor",
        "A2":  "Arena Magica"
      },

      //UserProfile
      "profile.userProfile": "Profil użytkownika",
      "profile.firstName": "Imię:",
      "profile.lastName": "Nazwisko:",
      "profile.indexNumber": "Numer indeksu:",
      "profile.editProfile": "Edytuj profil",
      "profile.blackListForum": "Czarna lista forum:",
      "profile.addBlacklistedCotent": "Dodaj treść do czarnej listy...",
      "profile.blacklistExample": "Frazy należy włożyć w cudzysłów: \"Pierwsza fraza\" \"Druga\" itd.",
      "profile.bio": "O mnie",
      "profile.bioPlaceholder": "Dodaj coś o sobie",

      //UserProfileEdit
      "profile.edit.editProfile": "Edytuj profil",
      "profile.edit.changePassword": "Zmień hasło",
      "profile.edit.changePasswordCancel": "Anuluj zmianę hasła",
      "profile.edit.saveChanges": "Zapisz zmiany",
      "profile.edit.oldPassword": "Obecne hasło:",
      "profile.edit.newPassword": "Nowe hasło:",
      "profile.edit.repeatPassword": "Powtórz hasło:",
      "profile.edit.cancel": "Anuluj:",
      "profile.edit.empty_names": "Pola na imię i nazwisko nie mogą być puste",
      "profile.edit.fill_both_passwords": "Wypełnij oba pola na hasło",
      "profile.edit.password_len": "Hasło musi posiadać minimum 6 znaków",
      "profile.edit.password_no_match": "Hasła nie są identyczne",
      "profile.edit.successful_update": "Dane zostały zaktualizowane",
      "profile.edit.unsuccessful_update": "Nie udało się zaktualizować danych",


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