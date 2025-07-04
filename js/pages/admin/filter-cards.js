// js/pages/admin/filter-cards.js
import { allStudents, currentFilter } from './state.js';
import { convertTo12HourFormat } from './helpers.js';
import { getGradeCounts } from './supabase-client.js';

export async function renderFilterCards() {
    const container = document.getElementById('stats-section').querySelector('.grid');
    
    try {
        const counts = await getGradeCounts();
        
        const cardsData = [
            { grade: 'all', label: 'إجمالي الطلاب', count: counts.all, icon: 'fa-users', color: 'violet' },
            { grade: 'first', label: 'الصف الأول', count: counts.first, icon: 'fa-child', color: 'blue' },
            { grade: 'second', label: 'الصف الثاني', count: counts.second, icon: 'fa-user-graduate', color: 'green' },
            { grade: 'third', label: 'الصف الثالث', count: counts.third, icon: 'fa-crown', color: 'orange' }
        ];
        
        container.innerHTML = cardsData.map(card => `
            <div data-grade="${card.grade}" class="filter-card group bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-${card.color}-400">
                <div class="text-center sm:text-right">
                    <p class="text-gray-500 text-xs sm:text-sm font-medium">${card.label}</p>
                    <p class="text-2xl sm:text-3xl font-bold">${card.count}</p>
                </div>
                <div class="bg-${card.color}-100 text-${card.color}-600 rounded-full p-3 mt-2 sm:mt-0 transition-transform group-hover:scale-110">
                    <i class="fas ${card.icon} fa-fw"></i>
                </div>
            </div>
        `).join('');
        
        // Set active state based on current filter
        const activeGrade = currentFilter.grade || 'all';
        const activeCard = container.querySelector(`[data-grade="${activeGrade}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        } else {
            // Fallback to 'all' if current grade not found
            const allCard = container.querySelector(`[data-grade="all"]`);
            if (allCard) allCard.classList.add('active');
        }
        
    } catch (error) {
        console.error('Error rendering filter cards with server data:', error);
        // Fallback to client-side counts
        renderFilterCardsClientSide();
    }
}

export async function refreshFilterCards() {
    try {
        await renderFilterCards();
    } catch (error) {
        console.error('Error refreshing filter cards:', error);
        renderFilterCardsClientSide();
    }
}

export function updateGroupStudentCount() {
    const countElement = document.getElementById('group-student-count');
    if (currentFilter.grade === 'all' || currentFilter.group === 'all') {
        countElement.textContent = '—';
        return;
    }
    const [filterGroup, filterTime] = currentFilter.group.split('|');
    const count = allStudents.filter(s => s.grade === currentFilter.grade && s.days_group === filterGroup && s.time_slot === filterTime).length;
    countElement.textContent = count;
}

function renderFilterCardsClientSide() {
    const container = document.getElementById('stats-section').querySelector('.grid');
    const counts = { 
        all: allStudents.length, 
        first: allStudents.filter(s => s.grade === 'first').length, 
        second: allStudents.filter(s => s.grade === 'second').length, 
        third: allStudents.filter(s => s.grade === 'third').length, 
    };
    
    const cardsData = [
        { grade: 'all', label: 'إجمالي الطلاب', count: counts.all, icon: 'fa-users', color: 'violet' },
        { grade: 'first', label: 'الصف الأول', count: counts.first, icon: 'fa-child', color: 'blue' },
        { grade: 'second', label: 'الصف الثاني', count: counts.second, icon: 'fa-user-graduate', color: 'green' },
        { grade: 'third', label: 'الصف الثالث', count: counts.third, icon: 'fa-crown', color: 'orange' }
    ];
    
    container.innerHTML = cardsData.map(card => `
        <div data-grade="${card.grade}" class="filter-card group bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-${card.color}-400">
            <div class="text-center sm:text-right">
                <p class="text-gray-500 text-xs sm:text-sm font-medium">${card.label}</p>
                <p class="text-2xl sm:text-3xl font-bold">${card.count}</p>
            </div>
            <div class="bg-${card.color}-100 text-${card.color}-600 rounded-full p-3 mt-2 sm:mt-0 transition-transform group-hover:scale-110">
                <i class="fas ${card.icon} fa-fw"></i>
            </div>
        </div>
    `).join('');
    
    // Set active state
    const activeGrade = currentFilter.grade || 'all';
    const activeCard = container.querySelector(`[data-grade="${activeGrade}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    } else {
        container.querySelector('[data-grade="all"]').classList.add('active');
    }
}
