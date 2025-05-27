# Mock Data Script

This Django management command creates mock data for testing the forum functionality.

## Usage

```bash
python manage.py add_mock_data
```

## Created Data

### Users
The script creates the following users (all with password: `NewPassword.00`):

**Students:**
- john.smith (230123@edu.p.lodz.pl)
- maria.garcia (230124@edu.p.lodz.pl)
- alex.kim (230125@edu.p.lodz.pl)
- anna.nowak (230126@edu.p.lodz.pl)
- piotr.kowalski (230127@edu.p.lodz.pl)

**Lecturers:**
- prof.johnson (prof.johnson@p.lodz.pl)
- dr.kowalczyk (dr.kowalczyk@p.lodz.pl)
- mgr.wisniewski (mgr.wisniewski@p.lodz.pl)

**Industry Representative:**
- industry.rep (industry.rep@company.com)

### Forum Content
The script creates 7 threads with various posts in different categories:

1. **"Jak przygotować się do egzaminu z Systemów Operacyjnych?"** - Exams category
2. **"Ktoś chętny do założenia grupy naukowej z Algorytmów?"** - Courses category (anonymous)
3. **"Pytanie o rejestrację na kursy w przyszłym semestrze"** - Other category
4. **"Najlepsze kawiarnie w pobliżu kampusu do nauki?"** - General category (anonymous)
5. **"Ważne ogłoszenie dotyczące terminu oddania projektu końcowego"** - Events category (by lecturer)
6. **"Czy ktoś ma notatki z zeszłotygodniowego wykładu z Uczenia Maszynowego?"** - Materials category
7. **"Oferty praktyk letnich w dziale rozwoju oprogramowania"** - Other category (by industry rep)

### Voting
The script also simulates voting activity on threads and posts with realistic upvote/downvote patterns.

## Notes
- The script uses `get_or_create` so it's safe to run multiple times
- Threads are created with different timestamps to simulate realistic activity
- Some threads are posted anonymously with nicknames
- Different visibility and answering permissions are set for variety