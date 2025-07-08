// js/pages/admin/filter-cards.js
import { currentFilter } from './state.js';
// No longer need getGradeCounts from supabase-client

export async function renderFilterCards(counts) { // Accepts counts as an argument
    const container = document.getElementById('stats-section').querySelector('.grid');
    
    // If counts are not provided, it means we need to fetch them (initial load).
    // This is now handled by applyFilters(), so this function is simpler.
    if (!counts) {
        // This can be left empty or show a loading state, as applyFilters will call it with data.
        return; 
    }

    try {
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
        
        const activeCard = container.querySelector(`[data-grade="${currentFilter.grade}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        } else {
            container.querySelector(`[data-grade="all"]`).classList.add('active');
        }
        
    } catch (error) {
        console.error('Error rendering filter cards:', error);
        container.innerHTML = `<p class="text-center text-red-500 col-span-4">فشل في تحميل الإحصائيات.</p>`;
    }
}