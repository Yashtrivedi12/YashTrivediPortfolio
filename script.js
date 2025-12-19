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
// Hero Section Animated Dots Background - Cursor Following
// ============================================

let heroDots = [];
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let isMouseInHero = false;
let animationFrameId = null;

function createHeroDotsOptimized() {
    const dotsContainer = document.getElementById('heroDots');
    const heroSection = document.querySelector('.hero');
    if (!dotsContainer || !heroSection) return;
    
    // Prevent multiple initializations
    if (dotsContainer.children.length > 0) return;
    
    // Calculate number of dots based on viewport size (performance optimized)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dotDensity = Math.min(Math.floor((viewportWidth * viewportHeight) / 10000), 111111); // Increased density (was 15000, now 10000) and max (was 60, now 90)
    
    // Clear existing dots array
    heroDots = [];
    
    // Create dots with initial random positions
    for (let i = 0; i < dotDensity; i++) {
        const dot = document.createElement('div');
        dot.className = 'hero-dot';
        
        // Random initial position
        const initialX = Math.random() * 100;
        const initialY = Math.random() * 100;
        
        // Random blinking parameters
        const blinkDelay = Math.random() * 2;
        const blinkDuration = 2.5 + Math.random() * 2.5;
        
        // Apply blinking animation
        dot.style.animation = `dotBlink ${blinkDuration}s ease-in-out infinite`;
        dot.style.animationDelay = `${blinkDelay}s`;
        
        // Set initial position (will be calculated properly in animate function)
        dot.style.left = '0';
        dot.style.top = '0';
        
        // Store dot data with different chase speeds for staggered effect
        const dotData = {
            element: dot,
            x: initialX,
            y: initialY,
            targetX: initialX,
            targetY: initialY,
            speed: 0.012 + Math.random() * 0.015, // Faster follow speed (0.012-0.037) for responsive following
            attractionRadius: 30 + Math.random() * 5, // Attraction radius in percentage (30-35%) - larger area attracts dots
            idleX: initialX,
            idleY: initialY,
            idleSpeed: 0.0005 + Math.random() * 0.008, // Very slow idle movement
            idleTargetX: initialX + (Math.random() - 0.5) * 20,
            idleTargetY: initialY + (Math.random() - 0.5) * 20
        };
        
        heroDots.push(dotData);
        dotsContainer.appendChild(dot);
    }
    
    // Set initial positions after a brief delay to ensure hero section is rendered
    setTimeout(() => {
        const heroRect = document.querySelector('.hero').getBoundingClientRect();
        heroDots.forEach(dot => {
            const initialPixelX = (dot.x / 100) * heroRect.width;
            const initialPixelY = (dot.y / 100) * heroRect.height;
            dot.element.style.transform = `translate(${initialPixelX}px, ${initialPixelY}px)`;
        });
        // Start animation loop
        startDotAnimation();
    }, 50);
}

function startDotAnimation() {
    if (animationFrameId) return; // Already running
    
    function animate() {
        const heroSection = document.querySelector('.hero');
        if (!heroSection || heroDots.length === 0) {
            animationFrameId = requestAnimationFrame(animate);
            return;
        }
        
        const heroRect = heroSection.getBoundingClientRect();
        const heroWidth = heroRect.width;
        const heroHeight = heroRect.height;
        
        heroDots.forEach((dot) => {
            const dotElement = dot.element;
            
            if (isMouseInHero) {
                // Calculate cursor position relative to hero section
                const cursorX = ((mouseX - heroRect.left) / heroWidth) * 100;
                const cursorY = ((mouseY - heroRect.top) / heroHeight) * 100;
                
                // Calculate distance from dot to cursor in percentage
                const dx = cursorX - dot.x;
                const dy = cursorY - dot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Only attract dots that are VERY close to cursor (small radius)
                if (distance < dot.attractionRadius) {
                    // Calculate attraction strength based on distance (stronger when closer)
                    // Use inverse square law for smooth falloff
                    const maxDistance = dot.attractionRadius;
                    const normalizedDistance = Math.min(distance / maxDistance, 1);
                    const attractionStrength = 1 - normalizedDistance; // 1 at cursor, 0 at edge
                    
                    // Move towards cursor, but maintain a small distance
                    const angle = Math.atan2(dy, dx);
                    const followDistance = 2; // Keep 2% distance from cursor
                    dot.targetX = cursorX - Math.cos(angle) * followDistance;
                    dot.targetY = cursorY - Math.sin(angle) * followDistance;
                    
                    // Use distance-based speed for smoother movement with easing
                    const adjustedSpeed = dot.speed * (0.3 + attractionStrength * 0.7);
                    // Apply easing for ultra-smooth movement
                    const dxToTarget = dot.targetX - dot.x;
                    const dyToTarget = dot.targetY - dot.y;
                    const distanceToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);
                    // Easing: faster when far, slower when close (smooth deceleration)
                    const easingFactor = Math.min(1, distanceToTarget * 2);
                    const finalSpeed = adjustedSpeed * (0.5 + easingFactor * 0.5);
                    dot.x += (dot.targetX - dot.x) * finalSpeed;
                    dot.y += (dot.targetY - dot.y) * finalSpeed;
                } else {
                    // Dot is too far - return to idle position smoothly
                    dot.targetX = dot.idleX;
                    dot.targetY = dot.idleY;
                    dot.x += (dot.targetX - dot.x) * dot.idleSpeed;
                    dot.y += (dot.targetY - dot.y) * dot.idleSpeed;
                }
            } else {
                // Idle movement when mouse is not in hero section
                dot.targetX = dot.idleTargetX;
                dot.targetY = dot.idleTargetY;
                
                // Change idle target occasionally
                if (Math.random() < 0.005) {
                    dot.idleTargetX = dot.idleX + (Math.random() - 0.5) * 20;
                    dot.idleTargetY = dot.idleY + (Math.random() - 0.5) * 20;
                }
                
                // Smooth interpolation towards idle target
                dot.x += (dot.targetX - dot.x) * dot.idleSpeed;
                dot.y += (dot.targetY - dot.y) * dot.idleSpeed;
            }
            
            // Calculate pixel positions
            const pixelX = (dot.x / 100) * heroWidth;
            const pixelY = (dot.y / 100) * heroHeight;
            
            // Update dot position using transform for better performance
            dotElement.style.transform = `translate(${pixelX}px, ${pixelY}px)`;
        });
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();
}

// Track mouse position
function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

// Check if mouse is in hero section
function handleMouseEnter() {
    isMouseInHero = true;
}

function handleMouseLeave() {
    isMouseInHero = false;
}

// Initialize mouse tracking
function initCursorTracking() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Track mouse movement globally for better responsiveness
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Track when mouse enters/leaves hero section
    heroSection.addEventListener('mouseenter', handleMouseEnter);
    heroSection.addEventListener('mouseleave', handleMouseLeave);
    
    // Also check mouse position on mouse move to handle edge cases
    document.addEventListener('mousemove', (e) => {
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            const rect = heroSection.getBoundingClientRect();
            const isInside = e.clientX >= rect.left && 
                           e.clientX <= rect.right && 
                           e.clientY >= rect.top && 
                           e.clientY <= rect.bottom;
            isMouseInHero = isInside;
        }
    }, { passive: true });
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
        // Initialize cursor tracking
        initCursorTracking();
    }, 100);
});

// Reinitialize on resize to adjust dot positions
window.addEventListener('resize', () => {
    const dotsContainer = document.getElementById('heroDots');
    if (dotsContainer && dotsContainer.children.length > 0) {
        // Reset dots on resize
        heroDots.forEach(dot => {
            const rect = dot.element.getBoundingClientRect();
            const heroRect = document.querySelector('.hero').getBoundingClientRect();
            dot.x = ((rect.left - heroRect.left) / heroRect.width) * 100;
            dot.y = ((rect.top - heroRect.top) / heroRect.height) * 100;
            dot.idleX = dot.x;
            dot.idleY = dot.y;
        });
    }
}, { passive: true });

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

