/**
 * OrioSearch Landing Page
 * - Terminal typing animation in hero
 * - Scroll-triggered fade-in animations
 * - Mobile nav toggle
 */

(function () {
  'use strict';

  // ========================================
  // Terminal typing animation
  // ========================================
  const COMMAND = `curl -s -X POST http://localhost:8000/search \\
  -H "Content-Type: application/json" \\
  -d '{"query": "what is docker", "include_answer": true}' | jq .`;

  const RESPONSE = `{
  <span class="code-key">"query"</span>: <span class="code-string">"what is docker"</span>,
  <span class="code-key">"answer"</span>: <span class="code-string">"Docker is an open-source platform that automates
    deployment inside lightweight containers [1]..."</span>,
  <span class="code-key">"results"</span>: [
    {
      <span class="code-key">"title"</span>: <span class="code-string">"What is Docker? | Docker Docs"</span>,
      <span class="code-key">"url"</span>: <span class="code-string">"https://docs.docker.com/get-started/"</span>,
      <span class="code-key">"score"</span>: <span class="code-num">0.95</span>
    }
  ],
  <span class="code-key">"response_time"</span>: <span class="code-num">1.87</span>
}`;

  function typeCommand() {
    const cmdEl = document.getElementById('typed-cmd');
    const cursorEl = document.getElementById('cursor');
    const outputEl = document.getElementById('terminal-output');
    if (!cmdEl) return;

    let i = 0;
    const speed = 25; // ms per character

    function type() {
      if (i < COMMAND.length) {
        cmdEl.textContent += COMMAND.charAt(i);
        i++;
        setTimeout(type, speed + Math.random() * 15);
      } else {
        // Done typing — hide cursor, show response
        setTimeout(function () {
          cursorEl.style.display = 'none';
          outputEl.innerHTML = RESPONSE;
          outputEl.classList.add('visible');
        }, 400);
      }
    }

    // Start after a brief delay
    setTimeout(type, 800);
  }

  // ========================================
  // Scroll fade-in animations
  // ========================================
  function initScrollAnimations() {
    // Add fade-in class to all animatable elements
    var targets = document.querySelectorAll(
      '.pain-card, .step, .feature-card, .swap-code, .ai-demo, ' +
      '.arch-diagram, .table-wrap, .qs-terminal'
    );

    targets.forEach(function (el) {
      el.classList.add('fade-in');
    });

    // Also add to section headings
    document.querySelectorAll('section h2, .section-sub').forEach(function (el) {
      el.classList.add('fade-in');
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.fade-in').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ========================================
  // Mobile navigation toggle
  // ========================================
  function initMobileNav() {
    var toggle = document.querySelector('.mobile-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });

    // Close on link click
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
      });
    });
  }

  // ========================================
  // Smooth nav shrink on scroll
  // ========================================
  function initNavScroll() {
    var nav = document.querySelector('.nav');
    if (!nav) return;

    var scrolled = false;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60 && !scrolled) {
        nav.style.borderBottomColor = 'var(--border-light)';
        scrolled = true;
      } else if (window.scrollY <= 60 && scrolled) {
        nav.style.borderBottomColor = 'var(--border)';
        scrolled = false;
      }
    });
  }

  // ========================================
  // Init
  // ========================================
  document.addEventListener('DOMContentLoaded', function () {
    typeCommand();
    initScrollAnimations();
    initMobileNav();
    initNavScroll();
  });
})();
