/**
 * Oracle ACE Theme - Main JavaScript
 * Based on Oracle.com Design System
 */

(function() {
    'use strict';

    // ============================================
    // DOM Ready
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        initPreloader();
        initNavbar();
        initScrollProgress();
        initScrollTop();
        initCounters();
        initToc();
        initAnimations();
        initCodeCopy();
    });

    // ============================================
    // Preloader
    // ============================================
    function initPreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        window.addEventListener('load', function() {
            preloader.classList.add('hidden');
            setTimeout(function() {
                preloader.style.display = 'none';
            }, 500);
        });
    }

    // ============================================
    // Navbar
    // ============================================
    function initNavbar() {
        const navbar = document.getElementById('navbar');
        const navbarToggle = document.getElementById('navbar-toggle');
        const navbarMobile = document.getElementById('navbar-mobile');
        
        if (!navbar) return;

        let lastScroll = 0;
        const navbarHeight = navbar.offsetHeight;

        // Scroll behavior
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;

            // Add/remove scrolled class
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Auto hide/Show navbar
            if (currentScroll > navbarHeight) {
                if (currentScroll > lastScroll) {
                    navbar.classList.add('hidden');
                } else {
                    navbar.classList.remove('hidden');
                }
            } else {
                navbar.classList.remove('hidden');
            }

            lastScroll = currentScroll;
        });

        // Mobile toggle
        if (navbarToggle && navbarMobile) {
            navbarToggle.addEventListener('click', function() {
                navbarMobile.classList.toggle('active');
                
                // Animate toggle bars
                const bars = navbarToggle.querySelectorAll('.toggle-bar');
                if (navbarMobile.classList.contains('active')) {
                    bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                    bars[1].style.opacity = '0';
                    bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
                } else {
                    bars[0].style.transform = '';
                    bars[1].style.opacity = '';
                    bars[2].style.transform = '';
                }
            });

            // Close mobile menu on link click
            const mobileLinks = navbarMobile.querySelectorAll('a');
            mobileLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    navbarMobile.classList.remove('active');
                    const bars = navbarToggle.querySelectorAll('.toggle-bar');
                    bars[0].style.transform = '';
                    bars[1].style.opacity = '';
                    bars[2].style.transform = '';
                });
            });
        }
    }

    // ============================================
    // Scroll Progress Bar
    // ============================================
    function initScrollProgress() {
        const progressBar = document.getElementById('scroll-progress-fill');
        if (!progressBar) return;

        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.width = scrollPercent + '%';
        });
    }

    // ============================================
    // Scroll to Top
    // ============================================
    function initScrollTop() {
        const scrollTopBtn = document.getElementById('scroll-top');
        if (!scrollTopBtn) return;

        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 500) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ============================================
    // Counter Animation
    // ============================================
    function initCounters() {
        const counters = document.querySelectorAll('.counter');
        if (!counters.length) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-target'));
                    animateCounter(counter, target);
                    observer.unobserve(counter);
                }
            });
        }, observerOptions);

        counters.forEach(function(counter) {
            observer.observe(counter);
        });
    }

    function animateCounter(element, target) {
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);
            
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target;
            }
        }

        requestAnimationFrame(update);
    }

    // ============================================
    // Table of Contents
    // ============================================
    function initToc() {
        const tocLinks = document.querySelectorAll('.toc-body a');
        const headings = document.querySelectorAll('.post-body h1, .post-body h2, .post-body h3');
        
        if (!tocLinks.length || !headings.length) return;

        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -60% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    tocLinks.forEach(function(link) {
                        link.classList.remove('active');
                        if (decodeURIComponent(link.getAttribute('href')) === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        headings.forEach(function(heading) {
            observer.observe(heading);
        });

        // Smooth scroll for TOC links
        tocLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = decodeURIComponent(this.getAttribute('href').slice(1));
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const navbarHeight = document.getElementById('navbar').offsetHeight;
                    const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ============================================
    // Scroll Animations
    // ============================================
    function initAnimations() {
        const animatedElements = document.querySelectorAll('[data-aos]');
        if (!animatedElements.length) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-aos-delay') || 0;
                    setTimeout(function() {
                        entry.target.classList.add('aos-animate');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animatedElements.forEach(function(element) {
            observer.observe(element);
        });
    }

    // ============================================
    // Smooth Scroll for Anchor Links
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const navbar = document.getElementById('navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ============================================
    // Code Block Copy (for figure.highlight)
    // ============================================
    function initCodeCopy() {
        document.querySelectorAll('figure.highlight').forEach(function(figure) {
            // Skip if already has copy button
            if (figure.querySelector('.copy-btn')) return;

            var button = document.createElement('button');
            button.className = 'copy-btn';
            button.setAttribute('aria-label', 'Copy code');
            button.setAttribute('title', 'Copy code');
            button.innerHTML = '<i class="fa-regular fa-copy"></i>';

            button.addEventListener('click', function() {
                var codeText = '';
                var codeElement = figure.querySelector('td.code pre');
                if (codeElement) {
                    codeElement.querySelectorAll('.line').forEach(function(line) {
                        codeText += line.textContent + '\n';
                    });
                } else {
                    var pre = figure.querySelector('pre');
                    if (pre) codeText = pre.textContent;
                }
                codeText = codeText.trim();
                if (!codeText) return;

                var showCopied = function() {
                    button.classList.add('copied');
                    button.innerHTML = '<i class="fa-solid fa-check"></i>';
                    setTimeout(function() {
                        button.classList.remove('copied');
                        button.innerHTML = '<i class="fa-regular fa-copy"></i>';
                    }, 2000);
                };

                var fallbackCopy = function() {
                    var textarea = document.createElement('textarea');
                    textarea.value = codeText;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '-9999px';
                    textarea.style.top = '0';
                    document.body.appendChild(textarea);
                    textarea.focus();
                    textarea.select();
                    try {
                        var ok = document.execCommand('copy');
                        if (ok) showCopied();
                    } catch (err) {
                        console.error('Copy failed:', err);
                    }
                    document.body.removeChild(textarea);
                };

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(codeText).then(showCopied).catch(fallbackCopy);
                } else {
                    fallbackCopy();
                }
            });

            figure.appendChild(button);
        });
    }

})();
