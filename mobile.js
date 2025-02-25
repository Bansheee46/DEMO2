document.addEventListener('DOMContentLoaded', () => {
  // Бургер-меню
  const burgerMenu = document.querySelector('.burger-menu');
  const mobileNav = document.getElementById('mobileMenu');

  if (burgerMenu && mobileNav) {
    burgerMenu.addEventListener('click', () => {
      const isExpanded = burgerMenu.getAttribute('aria-expanded') === 'true';
      burgerMenu.setAttribute('aria-expanded', !isExpanded);
      mobileNav.setAttribute('aria-hidden', isExpanded);
    });

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !burgerMenu.contains(e.target) && mobileNav.getAttribute('aria-hidden') === 'false') {
        mobileNav.setAttribute('aria-hidden', 'true');
        burgerMenu.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Баннер
  const banner = document.getElementById('banner');
  const bannerToggle = document.querySelector('.banner__toggle');

  if (banner && bannerToggle) {
    let isCollapsed = true;
    bannerToggle.addEventListener('click', () => {
      if (isCollapsed) {
        banner.classList.remove('collapsed');
        bannerToggle.classList.remove('active');
        isCollapsed = false;
      } else {
        banner.classList.add('collapsed');
        bannerToggle.classList.add('active');
        isCollapsed = true;
      }
    });
  }

  // Карусель
  const track = document.querySelector('.carousel__track');
  const items = document.querySelectorAll('.carousel__item');
  const prevButton = document.querySelector('.carousel__control--prev');
  const nextButton = document.querySelector('.carousel__control--next');

  if (track && items.length && prevButton && nextButton) {
    let currentIndex = 0;

    const updateCarousel = () => {
      const itemWidth = items[0].offsetWidth + 10;
      const containerWidth = track.parentElement.offsetWidth;
      const offset = (containerWidth - itemWidth) / 2;
      track.style.transform = `translateX(${-currentIndex * itemWidth + offset}px)`;
      items.forEach((item, i) => item.toggleAttribute('data-active', i === currentIndex));
    };

    prevButton.addEventListener('click', () => {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      updateCarousel();
    });

    nextButton.addEventListener('click', () => {
      currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      updateCarousel();
    });

    let startX;
    track.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX));
    track.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 30) nextButton.click();
      if (endX - startX > 30) prevButton.click();
    });

    window.addEventListener('load', updateCarousel);
    window.addEventListener('resize', updateCarousel);
  }

  // Анимация карточек
  const cards = document.querySelectorAll('.product-card');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 100);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  cards.forEach((card) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    card.style.transition = 'opacity 0.4s, transform 0.4s';
    observer.observe(card);
  });

  // Анимация иконок в островке по клику
  const contactLinks = document.querySelectorAll('.floating-contact__link');

  contactLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');

      contactLinks.forEach(otherLink => {
        if (otherLink !== link) {
          otherLink.classList.remove('active');
        }
      });

      link.classList.add('active');

      setTimeout(() => {
        link.classList.remove('active');
        window.location.href = href;
      }, 600);
    });
  });
});