
// Scroll animation observer with enhanced options
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -80px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Observe all scroll-fade elements
  const scrollElements = document.querySelectorAll('.scroll-fade');
  scrollElements.forEach(el => observer.observe(el));

  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Enhanced FAQ accordion functionality
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all FAQ items
      document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
      });

      // Open clicked item if it wasn't active
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Add button ripple effect
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mousedown', function(e) {
      // Only create ripple on actual click, not hover
      if (e.button === 0) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      }
    });
  });
});

// Enhanced parallax effect with smoother motion
let ticking = false;
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  lastScrollY = window.pageYOffset;

  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateParallax(lastScrollY);
      ticking = false;
    });
    ticking = true;
  }
});

// Discord Widget Toggle Function
function toggleDiscordWidget() {
  const panel = document.getElementById('discordWidgetPanel');
  panel.classList.toggle('show');
}

function updateParallax(scrollY) {
  const parallaxElements = document.querySelectorAll('.hero');

  parallaxElements.forEach(el => {
    const speed = 0.4;
    el.style.transform = `translateY(${scrollY * speed}px)`;
  });
}

// Add mouse move effect for cards
document.querySelectorAll('.feature-card, .discord-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// Copy script function
function copyScript() {
  const scriptText = 'loadstring(game:HttpGet("https://raw.githubusercontent.com/IAlwaysTap/Elisium-Free-script/refs/heads/main/Elisium.lol%20Free%20Script.txt"))()';

  navigator.clipboard.writeText(scriptText).then(() => {
    const btn = document.querySelector('.btn-copy');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = '#4CAF50';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

// Navbar background on scroll
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    navbar.style.background = 'rgba(10, 10, 15, 0.95)';
    navbar.style.borderBottom = '1px solid var(--border-color)';
    navbar.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.5)';
  } else {
    navbar.style.background = 'transparent';
    navbar.style.borderBottom = '1px solid transparent';
    navbar.style.boxShadow = 'none';
  }

  lastScroll = currentScroll;
});
