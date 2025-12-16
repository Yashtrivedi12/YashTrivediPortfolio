// ============================================
// Smooth Scrolling & Navigation
// ============================================

const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navbar = document.getElementById('navbar');

// Smooth scroll to sections
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
});

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// ============================================
// Navbar Always Visible (Sticky)
// ============================================

// Ensure navbar is always visible
function ensureNavbarVisible() {
    if (navbar) {
        navbar.classList.remove('hidden');
        navbar.style.display = 'block';
        navbar.style.visibility = 'visible';
        navbar.style.opacity = '1';
        navbar.style.transform = 'translateX(-50%)';
    }
}

// ============================================
// Scroll to Top Button
// ============================================

const scrollToTopBtn = document.getElementById('scrollToTop');

// Show/hide scroll to top button with expand/collapse animation
let expandTimeout;
let collapseTimeout;

function toggleScrollToTop() {
    if (window.scrollY > 300) {
        if (!scrollToTopBtn.classList.contains('show')) {
            scrollToTopBtn.classList.add('show');
            
            // Clear any existing timeouts
            clearTimeout(expandTimeout);
            clearTimeout(collapseTimeout);
            
            // Expand to show text after button appears
            expandTimeout = setTimeout(() => {
                scrollToTopBtn.classList.add('expanded');
                
                // Collapse after 1.5 seconds
                collapseTimeout = setTimeout(() => {
                    scrollToTopBtn.classList.remove('expanded');
                }, 1500);
            }, 300);
        }
    } else {
        scrollToTopBtn.classList.remove('show');
        scrollToTopBtn.classList.remove('expanded');
        clearTimeout(expandTimeout);
        clearTimeout(collapseTimeout);
    }
}

// Scroll to top functionality
scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Ensure navbar visibility on scroll
window.addEventListener('scroll', () => {
    ensureNavbarVisible();
    // Update active nav link
    updateActiveNavLink();
    // Toggle scroll to top button
    toggleScrollToTop();
}, { passive: true });

// Ensure navbar visibility on page load
window.addEventListener('load', () => {
    ensureNavbarVisible();
});

// Ensure navbar visibility on page load only (no periodic check needed)

// ============================================
// Active Navigation Link
// ============================================

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 120;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// ============================================
// Scroll-Triggered Animations
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all animatable elements
const animateElements = document.querySelectorAll(`
    .section-header,
    .about-content,
    .stat-item,
    .skill-card,
    .timeline-item,
    .project-card,
    .contact-content,
    .contact-header,
    .education-header,
    .education-card,
    .skills-header
`);

animateElements.forEach(el => {
    observer.observe(el);
});

// Stagger animation for skill cards
const skillCards = document.querySelectorAll('.skill-card');
skillCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
});

// Stagger animation for project cards
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
});

// Stagger animation for stat items
const statItems = document.querySelectorAll('.stat-item');
statItems.forEach((item, index) => {
    item.style.transitionDelay = `${index * 0.1}s`;
});

// ============================================
// Form Handling
// ============================================

const contactForm = document.getElementById('contactForm');
const submitButton = contactForm.querySelector('.btn-submit');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Create ripple effect
    const ripple = submitButton.querySelector('.ripple');
    if (ripple) {
        ripple.style.animation = 'none';
        setTimeout(() => {
            ripple.style.animation = 'ripple-animation 0.6s ease-out';
        }, 10);
    }
    
    // Get form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);
    
    // Simulate form submission
    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = 'Sending...';
    submitButton.setAttribute('aria-busy', 'true');
    
    setTimeout(() => {
        // Reset form
        contactForm.reset();
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.querySelector('span').textContent = 'Message Sent! ✓';
        submitButton.setAttribute('aria-live', 'polite');
        
        setTimeout(() => {
            submitButton.querySelector('span').textContent = 'Send Message';
            submitButton.removeAttribute('aria-live');
        }, 3000);
    }, 1500);
    
    // In a real application, you would send the data to a server here
    console.log('Form submitted:', data);
});

// ============================================
// Subtle Hero Fade on Scroll (Lightweight)
// ============================================

const hero = document.querySelector('.hero');
const heroContent = document.querySelector('.hero-content');

if (hero && heroContent) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroHeight = hero.offsetHeight;
        
        if (scrolled < heroHeight && scrolled > 100) {
            // Subtle fade only, no heavy parallax transform
            const opacity = Math.max(0.7, 1 - (scrolled / heroHeight) * 0.3);
            heroContent.style.opacity = opacity;
        } else if (scrolled <= 100) {
            heroContent.style.opacity = '1';
        }
    }, { passive: true });
}

// ============================================
// Typing Animation
// ============================================

function typeText(element, text, speed = 50, callback) {
    let i = 0;
    // Store any child elements (like emoji) before clearing
    const preservedChildren = Array.from(element.children).map(child => child.cloneNode(true));
    element.textContent = '';
    element.classList.remove('complete');
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            element.classList.add('complete');
            // Restore preserved children after typing completes
            preservedChildren.forEach(child => {
                element.appendChild(child);
            });
            if (callback) callback();
        }
    }
    
    type();
}

function startTypingAnimations() {
    const greeting = document.getElementById('greeting');
    const name = document.getElementById('name');
    const role = document.getElementById('role');
    
    if (greeting && name && role) {
        // Start typing animations in sequence
        setTimeout(() => {
            // Type "Hi " - emoji will be preserved by typeText function
            typeText(greeting, "Hi ", 80, () => {
                setTimeout(() => {
                    // Type "I'm Yash Trivedi" character by character
                    typeText(name, "I'm Yash Trivedi", 100, () => {
                        setTimeout(() => {
                            typeText(role, "Flutter Developer", 80);
                        }, 500);
                    });
                }, 500);
            });
        }, 800);
    }
}

// ============================================
// Hero Section Animated Dots Background
// ============================================

function createHeroDotsOptimized() {
    const dotsContainer = document.getElementById('heroDots');
    if (!dotsContainer) return;
    
    // Prevent multiple initializations
    if (dotsContainer.children.length > 0) return;
    
    // Calculate number of dots based on viewport size (performance optimized)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dotDensity = Math.min(Math.floor((viewportWidth * viewportHeight) / 15000), 80);
    
    // Create style element for keyframes
    let styleSheet = document.getElementById('heroDotsStyles');
    if (!styleSheet) {
        styleSheet = document.createElement('style');
        styleSheet.id = 'heroDotsStyles';
        document.head.appendChild(styleSheet);
    }
    
    let keyframesCSS = '';
    const dots = [];
    const dotConfigs = [];
    
    // First pass: Generate all dot configurations
    for (let i = 0; i < dotDensity; i++) {
        // Random initial position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random movement parameters (more visible movement)
        const moveX = (Math.random() - 0.5) * 50; // -25 to 25px
        const moveY = (Math.random() - 0.5) * 50;
        const moveDuration = 15 + Math.random() * 20; // 15-35 seconds
        
        // Random blinking parameters (independent timing)
        const blinkDelay = Math.random() * 2;
        const blinkDuration = 2.5 + Math.random() * 2.5; // 2.5-5 seconds
        
        // Random movement delay for staggered effect
        const moveDelay = Math.random() * 3;
        
        // Create unique keyframe animation for floating movement
        const animationName = `floatDot${i}`;
        keyframesCSS += `
            @keyframes ${animationName} {
                0% { transform: translate(0, 0); }
                25% { transform: translate(${moveX * 0.7}px, ${moveY * 0.7}px); }
                50% { transform: translate(${moveX}px, ${moveY}px); }
                75% { transform: translate(${moveX * 0.7}px, ${moveY * 0.7}px); }
                100% { transform: translate(0, 0); }
            }
        `;
        
        dotConfigs.push({
            x,
            y,
            animationName,
            moveDuration,
            blinkDuration,
            moveDelay,
            blinkDelay
        });
    }
    
    // Inject all keyframes first
    styleSheet.textContent = keyframesCSS;
    
    // Force a reflow to ensure keyframes are registered
    void styleSheet.offsetHeight;
    
    // Second pass: Create dots and apply animations
    dotConfigs.forEach((config, i) => {
        const dot = document.createElement('div');
        dot.className = 'hero-dot floating';
        
        // Set initial position
        dot.style.left = `${config.x}%`;
        dot.style.top = `${config.y}%`;
        
        // Apply animations with proper delays
        dot.style.animation = `${config.animationName} ${config.moveDuration}s ease-in-out infinite, dotBlink ${config.blinkDuration}s ease-in-out infinite`;
        dot.style.animationDelay = `${config.moveDelay}s, ${config.blinkDelay}s`;
        
        dots.push(dot);
    });
    
    // Append all dots at once using DocumentFragment (better performance)
    const fragment = document.createDocumentFragment();
    dots.forEach(dot => fragment.appendChild(dot));
    dotsContainer.appendChild(fragment);
    
    // Force reflow to trigger animations
    void dotsContainer.offsetHeight;
}

// ============================================
// Smooth Page Load Animation
// ============================================

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
        startTypingAnimations();
        // Initialize hero dots after page load
        createHeroDotsOptimized();
    }, 100);
});

// ============================================
// Keyboard Navigation
// ============================================

document.addEventListener('keydown', (e) => {
    // Close mobile menu on Escape key
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// ============================================
// Touch Gestures for Mobile
// ============================================

let touchStartX = 0;
let touchEndX = 0;

navMenu.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

navMenu.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        // Swipe left - close menu
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
}

// ============================================
// Performance Optimization
// ============================================

// Throttle scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply throttling to scroll-heavy functions if needed
const throttledScroll = throttle(() => {
    updateActiveNavLink();
}, 100);

window.addEventListener('scroll', throttledScroll, { passive: true });

