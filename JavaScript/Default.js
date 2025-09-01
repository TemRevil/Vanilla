// ------------------------------------------
// Selector Dropdown
// ------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.selector[selector-id]').forEach(selector => {
        const trigger = selector.querySelector('.selector-trigger');
        const dropdown = selector.querySelector('.selector-dropdown');
        const selectedText = trigger.querySelector('span');
        const selectorId = selector.getAttribute('selector-id');

        // Generate options from data-options
        const optionsData = dropdown.getAttribute('data-options');
        if (optionsData) {
            dropdown.innerHTML = '';
            optionsData.split(',').forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option';
                btn.textContent = opt.trim();
                btn.dataset.value = opt.trim();
                dropdown.appendChild(btn);
            });
        }

        // Set initial value
        const selected = dropdown.getAttribute('selected');
        selectedText.textContent = selected || dropdown.querySelector('.option')?.textContent || 'Select';

        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            selector.classList.toggle('open');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) selector.classList.remove('open');
        });

        // Handle option selection
        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('option')) {
                const value = e.target.dataset.value;
                selectedText.textContent = e.target.textContent;
                dropdown.setAttribute('selected', value);
                trigger.setAttribute('selected-id', selectorId);
                selector.classList.remove('open');
                
                // Dispatch event
                selector.dispatchEvent(new CustomEvent('selectorChange', {
                    detail: { selectorId, value, text: e.target.textContent }
                }));
            }
        });
    });
});

const getSelectorValue = (id) => document.querySelector(`[selector-id="${id}"] .selector-dropdown`).getAttribute('selected');
const setSelectorValue = (id, value) => {
    const selector = document.querySelector(`[selector-id="${id}"]`);
    const option = selector.querySelector(`[data-value="${value}"]`);
    if (option) option.click();
};
// ------------------------------------------
// Animate Blur Function
// ------------------------------------------
function animateBlur(el, open, blur = 20, cb) {
    if (!el) return;
    el.style.transition = 'backdrop-filter 0.15s ease';
    el.classList.toggle('off', !open);
    el.style.backdropFilter = open ? 'blur(0px)' : `blur(${blur}px)`;
    requestAnimationFrame(() => {
        el.style.backdropFilter = open ? `blur(${blur}px)` : 'blur(0px)';
        if (!open) setTimeout(() => { el.classList.add('off'); cb?.(); }, 150);
    });
}
// ------------------------------------------
// Section Toggles
// ------------------------------------------
function initSectionToggles() {
    const buttons = document.querySelectorAll('[v-target]');
    const sections = document.querySelectorAll('[d-target]');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('v-target');
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            sections.forEach(section => {
                section.classList.toggle('off', section.getAttribute('d-target') !== target);
            });
        });
    });
}

initSectionToggles();
// ------------------------------------------
// Range Input
function rangeSliderInit() {
  document.querySelectorAll('.range-slider').forEach(slider => {
    const name = slider.getAttribute('range-name') || 'Slider';
    const optsAttr = slider.getAttribute('range-options') || '';
    const def = slider.getAttribute('default-range') || '';

    const opts = optsAttr.split(',').map(o => {
      const [label, desc] = o.split(':').map(s => s.trim());
      return { label, desc };
    });

    const defIndex = opts.findIndex(o => o.label === def);
    const max = opts.length - 1;
    const val = defIndex >= 0 ? defIndex : 0;

    // Set CSS variable for dynamic ticks
    slider.style.setProperty('--tick-count', opts.length);

    slider.innerHTML = `
      <p class="text">${name}</p>
      <div class="range-wrapper">
        <input type="range" min="0" max="${max}" step="1" value="${val}" class="range">
      </div>
      <div class="ticks">
        ${opts.map(o => `
          <div class="tick">
            <div class="tick-line"></div>
            <div class="tick-label">${o.label}</div>
          </div>
        `).join('')}
      </div>
      <p class="range-opt-description">${opts[val]?.desc || ''}</p>
    `;

    const input = slider.querySelector('input');
    const desc = slider.querySelector('.range-opt-description');

    input.addEventListener('input', () => {
      desc.textContent = opts[+input.value]?.desc || '';
    });
  });
}

rangeSliderInit();
// ------------------------------------------
export { animateBlur };