/**
 * Interactive Technical Quiz Engine
 * Personal Academic Blog - AcademicPages
 * Lightweight, modular, and accessible quiz runner supporting declarative data attributes
 */

(function () {
  'use strict';

  // Global registry for quiz answer keys (can be populated per-page or per-form)
  window.quizAnswerKeys = window.quizAnswerKeys || {
    'llm-systems-quiz': {
      q1: 'B',
      q2: 'B',
      q3: 'B',
      q4: 'B'
    },
    'moe-router-stability-quiz': {
      q1: 'B',
      q2: 'B',
      q3: 'B',
      q4: 'B'
    },
    'pretraining-hero-run-quiz': {
      q1: 'C',
      q2: 'B',
      q3: 'A',
      q4: 'D'
    }
  };

  /**
   * Resolves a quiz form element from an event, element, or ID string.
   */
  function resolveForm(target) {
    if (!target) {
      return (
        document.getElementById('llm-systems-quiz') ||
        document.querySelector('form.interactive-quiz-form') ||
        document.querySelector('.quiz-container form')
      );
    }
    if (typeof target === 'string') {
      return document.getElementById(target);
    }
    if (target instanceof HTMLFormElement) {
      return target;
    }
    if (target instanceof HTMLElement) {
      return target.closest('form') || target.querySelector('form');
    }
    return null;
  }

  /**
   * Retrieves the answer key for a given form.
   * Priority:
   * 1. Form data-answer-key JSON attribute
   * 2. Card data-correct attributes
   * 3. window.quizAnswerKeys[form.id]
   */
  function getAnswerKey(form) {
    const key = {};

    // 1. Check window registry
    if (form.id && window.quizAnswerKeys[form.id]) {
      Object.assign(key, window.quizAnswerKeys[form.id]);
    }

    // 2. Check form data-answer-key
    if (form.dataset && form.dataset.answerKey) {
      try {
        const parsed = JSON.parse(form.dataset.answerKey);
        Object.assign(key, parsed);
      } catch (e) {
        console.warn('Failed to parse data-answer-key JSON:', e);
      }
    }

    // 3. Check individual cards for data-correct
    const cards = form.querySelectorAll('.quiz-card');
    cards.forEach((card, idx) => {
      const qName = card.dataset.question || 'q' + (idx + 1);
      if (card.dataset.correct) {
        key[qName] = card.dataset.correct.trim().toUpperCase();
      }
    });

    return key;
  }

  /**
   * Evaluates all questions in a quiz form and renders score badges and explanations.
   */
  function evaluateQuiz(target) {
    const form = resolveForm(target);
    if (!form) return;

    const cards = form.querySelectorAll('.quiz-card');
    if (cards.length === 0) return;

    const answerKey = getAnswerKey(form);
    const unselected = [];
    const questions = [];

    cards.forEach((card, idx) => {
      const radio = card.querySelector('input[type="radio"]');
      const qName = card.dataset.question || (radio ? radio.name : 'q' + (idx + 1));
      questions.push({ card, qName, index: idx + 1 });

      const selected = form.querySelector('input[name="' + qName + '"]:checked');
      if (!selected) {
        unselected.push({ name: 'Q' + (idx + 1), card });
      }
    });

    const banner = form.querySelector('.quiz-result-banner') || document.getElementById('quiz-result-banner');

    // Validation: Require all questions to be answered
    if (unselected.length > 0) {
      if (banner) {
        banner.className = 'quiz-result-banner warning';
        banner.style.display = 'block';
        banner.innerHTML =
          '⚠️ <strong>Incomplete:</strong> Please answer <strong>' +
          unselected.map(u => u.name).join(', ') +
          '</strong> before submitting.';
      }
      unselected[0].card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    let score = 0;

    // Evaluate answers
    questions.forEach(({ card, qName }) => {
      const correctVal = answerKey[qName];
      const selected = form.querySelector('input[name="' + qName + '"]:checked');
      const chosenVal = selected ? selected.value : null;

      // Remove previously attached badges
      card.querySelectorAll('.opt-badge').forEach(b => b.remove());

      // Evaluate options
      ['A', 'B', 'C', 'D'].forEach(opt => {
        const label =
          form.querySelector('#label-' + qName + '-' + opt) ||
          card.querySelector('label[data-option="' + opt + '"]') ||
          card.querySelector('input[name="' + qName + '"][value="' + opt + '"]')?.closest('.quiz-option');

        if (!label) return;
        label.classList.remove('opt-correct', 'opt-incorrect');

        if (opt === correctVal) {
          label.classList.add('opt-correct');
          const badge = document.createElement('span');
          badge.className = 'opt-badge correct';
          badge.textContent = '✓ Correct';
          label.appendChild(badge);
        } else if (opt === chosenVal && chosenVal !== correctVal) {
          label.classList.add('opt-incorrect');
          const badge = document.createElement('span');
          badge.className = 'opt-badge wrong';
          badge.textContent = '✗ Your Choice';
          label.appendChild(badge);
        }
      });

      if (chosenVal === correctVal) {
        score++;
      }

      // Reveal explanation
      const expl =
        form.querySelector('#expl-' + qName) ||
        card.querySelector('.quiz-explanation');
      if (expl) {
        expl.style.display = 'block';
      }
    });

    // Score calculation & messaging
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    if (banner) {
      banner.className = 'quiz-result-banner success';
      banner.style.display = 'block';

      let gradeMessage = '';
      if (form.dataset && form.dataset.msgPerfect && percentage === 100) {
        gradeMessage = form.dataset.msgPerfect;
      } else if (form.dataset && form.dataset.msgGood && percentage >= 75) {
        gradeMessage = form.dataset.msgGood;
      } else if (percentage === 100) {
        gradeMessage =
          '🎯 <strong>Score: ' +
          score +
          '/' +
          total +
          ' (100%):</strong> Flawless. You have demonstrated comprehensive architectural mastery over all core systems concepts in this module.';
      } else if (percentage >= 75) {
        gradeMessage =
          '👏 <strong>Score: ' +
          score +
          '/' +
          total +
          ' (' +
          percentage +
          '%):</strong> Strong systems intuition. Review the expanded post-mortems above for fine-grained edge cases.';
      } else {
        gradeMessage =
          '💡 <strong>Score: ' +
          score +
          '/' +
          total +
          ' (' +
          percentage +
          '%):</strong> Distributed AI systems have sharp corners. Examine the detailed breakdowns above for each architectural tradeoff.';
      }

      banner.innerHTML = gradeMessage;
      banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Resets the quiz form, clearing selections, feedback styling, badges, and explanations.
   */
  function resetQuiz(target) {
    const form = resolveForm(target);
    if (!form) return;

    form.reset();

    const cards = form.querySelectorAll('.quiz-card');
    cards.forEach(card => {
      card.querySelectorAll('.quiz-option').forEach(label => {
        label.classList.remove('opt-correct', 'opt-incorrect');
      });
      card.querySelectorAll('.opt-badge').forEach(b => b.remove());
      const expl = card.querySelector('.quiz-explanation');
      if (expl) {
        expl.style.display = 'none';
      }
    });

    const banner = form.querySelector('.quiz-result-banner') || document.getElementById('quiz-result-banner');
    if (banner) {
      banner.style.display = 'none';
      banner.className = 'quiz-result-banner';
      banner.innerHTML = '';
    }
  }

  // Bind to window for global / inline event access
  window.evaluateQuiz = evaluateQuiz;
  window.resetQuiz = resetQuiz;

  // Auto-bind event listeners when DOM is ready
  function initQuizzes() {
    document.querySelectorAll('form.interactive-quiz-form, form#llm-systems-quiz, .quiz-container form').forEach(form => {
      const submitBtn =
        form.querySelector('#btn-submit-quiz') ||
        form.querySelector('button[data-quiz-action="submit"]') ||
        form.querySelector('.quiz-btn-primary');
      if (submitBtn && !submitBtn.dataset.bound) {
        submitBtn.dataset.bound = 'true';
        submitBtn.addEventListener('click', function (e) {
          e.preventDefault();
          evaluateQuiz(form);
        });
      }

      const resetBtn =
        form.querySelector('#btn-reset-quiz') ||
        form.querySelector('button[data-quiz-action="reset"]') ||
        form.querySelector('.quiz-btn-secondary');
      if (resetBtn && !resetBtn.dataset.bound) {
        resetBtn.dataset.bound = 'true';
        resetBtn.addEventListener('click', function (e) {
          e.preventDefault();
          resetQuiz(form);
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuizzes);
  } else {
    initQuizzes();
  }
})();
