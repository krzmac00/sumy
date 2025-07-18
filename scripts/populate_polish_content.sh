#!/bin/bash

# Script to populate database with Polish content related to Politechnika Łódzka

echo "======================================"
echo "Populowanie bazy danych polską treścią"
echo "======================================"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run the management command
python manage.py populate_polish_content

echo ""
echo "======================================"
echo "Zakończono tworzenie zawartości!"
echo "======================================"
echo ""
echo "Utworzono:"
echo "- 5 wydarzeń (events)"
echo "- 5 ogłoszeń (advertisements)" 
echo "- 5 aktualności (news) - w tym 2 typu 'wydarzenie'"
echo ""
echo "Użytkownicy testowi (hasło dla wszystkich: Test123!):"
echo "- jan.kowalski (wykładowca)"
echo "- anna.nowak (wykładowca)"
echo "- marek.kaminski (wykładowca)"
echo "- piotr.wisniewski (student, nr indeksu: 234567)"
echo "- katarzyna.wojcik (student, nr indeksu: 234568)"
echo ""