// import { animateBlur } from './Default.js';
// ------------------------------------------
// Opening Settings Modal with Sliding Effect
function SlidingSettings() {
    const modal = document.querySelector('.modal-settings');
    const blur = document.querySelector('.wh');
    if (!modal || !blur) return;
    const POSITIONS = { OPEN: 20, CLOSED: -430 };
    let isDragging = false, startX = 0, startRight = 0;

    function isOnHandle(e) {
        const rect = modal.getBoundingClientRect();
        // ::before is 8px wide, 150px tall, left: -20px, top: 310px
        const handleLeft = rect.left - 20;
        const handleRight = handleLeft + 8;
        const handleTop = rect.top + 310;
        const handleBottom = handleTop + 150;
        return (
            e.clientX >= handleLeft && e.clientX <= handleRight &&
            e.clientY >= handleTop && e.clientY <= handleBottom
        );
    }

    function updatePosition(right) {
        const clamped = Math.max(POSITIONS.CLOSED, Math.min(POSITIONS.OPEN, right));
        modal.style.right = `${clamped}px`;
        // Animate blur overlay
        if (typeof animateBlur === 'function') {
            animateBlur(blur, clamped !== POSITIONS.CLOSED, 20);
        } else {
            blur.classList.toggle('off', clamped === POSITIONS.CLOSED);
            blur.style.backdropFilter = clamped !== POSITIONS.CLOSED ? 'blur(20px)' : 'blur(0px)';
        }
    }

    function handleDragStart(e) {
        if (isOnHandle(e)) {
            isDragging = true;
            startX = e.clientX;
            startRight = parseInt(modal.style.right) || POSITIONS.CLOSED;
            document.body.style.userSelect = 'none';
        }
    }
    function handleDragMove(e) {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        updatePosition(startRight - deltaX);
    }
    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
        const currentRight = parseInt(modal.style.right) || POSITIONS.CLOSED;
        updatePosition(currentRight > (POSITIONS.CLOSED + (POSITIONS.OPEN - POSITIONS.CLOSED) / 2) ? POSITIONS.OPEN : POSITIONS.CLOSED);
    }

    // Only allow click on handle to toggle
    modal.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    modal.addEventListener('click', (e) => {
        if (!isDragging && isOnHandle(e)) {
            const currentRight = parseInt(modal.style.right) || POSITIONS.CLOSED;
            updatePosition(currentRight === POSITIONS.CLOSED ? POSITIONS.OPEN : POSITIONS.CLOSED);
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') updatePosition(POSITIONS.CLOSED);
    });
    // Initial state
    modal.style.right = `${POSITIONS.CLOSED}px`;
}

window.SlidingSettings = SlidingSettings;
SlidingSettings();
// ------------------------------------------