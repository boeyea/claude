// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Gumroad Integration
// Replace these with your actual Gumroad product links
const GUMROAD_LINKS = {
    'creator-os': 'https://yourname.gumroad.com/l/creator-os',
    'business-hub': 'https://yourname.gumroad.com/l/business-hub',
    'productivity-system': 'https://yourname.gumroad.com/l/productivity-system',
    'student-hub': 'https://yourname.gumroad.com/l/student-hub',
    'complete-bundle': 'https://yourname.gumroad.com/l/complete-bundle'
};

// Handle purchase button clicks
function handlePurchase(productId, price) {
    // Track analytics (optional - add Google Analytics or similar)
    if (window.gtag) {
        gtag('event', 'begin_checkout', {
            currency: 'USD',
            value: price,
            items: [{
                item_id: productId,
                item_name: productId.replace('-', ' '),
                price: price
            }]
        });
    }

    // For testing: Show alert
    // Remove this and uncomment Gumroad redirect for production
    alert(`Redirecting to checkout for ${productId} ($${price})\n\nTo make this live:\n1. Create products on Gumroad\n2. Update GUMROAD_LINKS in script.js\n3. Remove this alert and uncomment the redirect`);

    // Uncomment this for production with real Gumroad links
    // window.location.href = GUMROAD_LINKS[productId];

    return false;
}

// Add scroll animation for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate elements on scroll
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.template-card, .feature, .faq-item');

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Email capture (optional - integrate with ConvertKit, Mailchimp, etc.)
function captureEmail(email) {
    // Add your email marketing integration here
    console.log('Email captured:', email);

    // Example with ConvertKit (replace with your form ID)
    // fetch('https://api.convertkit.com/v3/forms/YOUR_FORM_ID/subscribe', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email: email })
    // });
}

// Add countdown timer for sales (optional)
function addCountdownTimer(endDate) {
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = endDate - now;

        if (distance < 0) {
            clearInterval(timer);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        console.log(`${days}d ${hours}h ${minutes}m remaining`);
    }, 1000);
}

// Simple A/B testing helper (optional)
function abTest(variants) {
    const variant = variants[Math.floor(Math.random() * variants.length)];
    return variant;
}

// Exit intent popup (optional - show discount when user tries to leave)
let exitIntentShown = false;
document.addEventListener('mouseout', (e) => {
    if (!exitIntentShown && e.clientY < 0) {
        exitIntentShown = true;
        // Show discount popup or special offer
        // alert('Wait! Get 10% off with code: SAVE10');
    }
});
