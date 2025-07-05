// js/pages/schedule-admin/time-builder.js
import { showToast } from './ui-helpers.js';
import { convertDigitsToArabic, convertTo24HourFormat, convertTo12HourArabic } from './ui-helpers.js';

export function createTimeBuilder(elements) {
    let addedTimes = new Set();
    let editingTime = null;

    function setup() {
        populateSelect(elements.timeHourSelect, Array.from({length: 12}, (_, i) => ({v: i + 1, t: convertDigitsToArabic(i + 1)})), 'الساعة');
        populateSelect(elements.timeMinuteSelect, ['00', '15', '30', '45'].map(m => ({v: m, t: convertDigitsToArabic(m)})), 'الدقيقة');
        populateSelect(elements.timePeriodSelect, [{v: 'AM', t: 'ص'}, {v: 'PM', t: 'م'}], 'الفترة');
        updatePreview();
    }
    
    function updatePreview() {
        const h = elements.timeHourSelect.value, m = elements.timeMinuteSelect.value, p = elements.timePeriodSelect.value;
        if (!h || !m || !p) {
            elements.timePreview.textContent = '--:--';
            elements.addTimeBtn.disabled = true;
            return;
        }
        const time24 = convertTo24HourFormat(h, m, p);
        elements.timePreview.textContent = convertTo12HourArabic(time24);
        elements.addTimeBtn.disabled = addedTimes.has(time24) && time24 !== editingTime;
    }

    function add() {
        const h = elements.timeHourSelect.value, m = elements.timeMinuteSelect.value, p = elements.timePeriodSelect.value;
        if (!h || !m || !p) return showToast('يرجى اختيار ساعة ودقيقة وفترة ص/م.', 'error');
        const time24 = convertTo24HourFormat(h, m, p);
        if (editingTime) {
            if (addedTimes.has(time24) && time24 !== editingTime) return showToast('هذا الموعد موجود بالفعل.', 'error');
            addedTimes.delete(editingTime);
            addedTimes.add(time24);
            editingTime = null;
            elements.addTimeBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة وقت';
        } else {
            if (addedTimes.has(time24)) return showToast('هذا الموعد تم إضافته بالفعل.', 'error');
            addedTimes.add(time24);
        }
        renderPills();
        updatePreview();
    }
    
    function renderPills() {
        elements.timePillsContainer.innerHTML = '';
        Array.from(addedTimes).sort().forEach(time => { // Sort times for consistent order
            const pill = document.createElement('div');
            pill.className = 'time-pill';
            if (time === editingTime) pill.classList.add('editing');
            pill.innerHTML = `<span>${convertTo12HourArabic(time)}</span><button type="button" class="time-pill-remove">×</button>`;
            
            pill.addEventListener('click', (e) => { if (!e.target.classList.contains('time-pill-remove')) edit(time); });
            pill.querySelector('.time-pill-remove').addEventListener('click', (e) => { e.stopPropagation(); remove(time); });
            elements.timePillsContainer.appendChild(pill);
        });
    }

    function edit(time) {
        editingTime = time;
        prefill(time); // Use the new prefill function
        elements.addTimeBtn.innerHTML = '<i class="fas fa-check"></i> تحديث الوقت';
        renderPills();
    }

    // ADDED: New function to pre-fill the time builder dropdowns
    function prefill(time24) {
        if (!time24) return;
        const [h24, m] = time24.split(':');
        const hour24 = parseInt(h24, 10);
        const period = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

        elements.timeHourSelect.value = hour12;
        elements.timeMinuteSelect.value = m;
        elements.timePeriodSelect.value = period;
        updatePreview();
    }
    
    function remove(time) {
        addedTimes.delete(time);
        if (editingTime === time) {
            editingTime = null;
            elements.addTimeBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة وقت';
        }
        renderPills();
        updatePreview();
    }

    function clear() {
        addedTimes.clear();
        editingTime = null;
        renderPills();
        updatePreview();
    }

    function getTimes() {
        return Array.from(addedTimes);
    }
    
    function setTimes(times = []) {
        addedTimes = new Set(times);
        renderPills();
    }

    function populateSelect(select, options, placeholder) {
        select.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        options.forEach(opt => select.innerHTML += `<option value="${opt.v}">${opt.t}</option>`);
        select.value = "";
    }

    elements.addTimeBtn.addEventListener('click', add);
    [elements.timeHourSelect, elements.timeMinuteSelect, elements.timePeriodSelect].forEach(el => el.addEventListener('change', updatePreview));
    
    // Public API for the time builder
    return { setup, getTimes, setTimes, clear, prefill }; // Expose the new function
}