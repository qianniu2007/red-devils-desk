/* Quiz page: ten questions, one at a time, every correction carries a link
   to the page that proves it. Best score kept in localStorage. */
(function () {
  'use strict';

  var QUESTIONS = [
    {
      q: 'In which season did Manchester United win the first Premier League title?',
      a: ['1990–91', '1992–93', '1993–94', '1995–96'],
      correct: 1,
      why: 'United were founder members and the inaugural champions in 1992–93, ending a 26-year wait for a league title.',
      source: { href: 'seasons.html', label: 'Season by season' }
    },
    {
      q: 'Who is the club’s all-time record goalscorer?',
      a: ['Bobby Charlton', 'Denis Law', 'Wayne Rooney', 'Ruud van Nistelrooy'],
      correct: 2,
      why: 'Wayne Rooney scored 253 goals in 559 appearances between 2004 and 2017, passing Bobby Charlton’s 249 in 2015.',
      source: { href: 'legends.html', label: 'The full index' }
    },
    {
      q: 'How many English top-flight league titles has the club won?',
      a: ['18', '19', '20', '21'],
      correct: 2,
      why: 'Twenty: a joint record. United passed Liverpool’s 18 with their 19th in 2010–11, then won a 20th in 2012–13.',
      source: { href: 'trophies.html', label: 'The cabinet' }
    },
    {
      q: 'In which year did United become the first English club to win the European Cup?',
      a: ['1958', '1963', '1968', '1977'],
      correct: 2,
      why: '1968 at Wembley, 4–1 against Benfica, ten years after the Munich air disaster.',
      source: { href: 'trophies.html', label: 'The cabinet' }
    },
    {
      q: 'How many points did United take from the 2024–25 Premier League season?',
      a: ['42', '52', '58', '64'],
      correct: 0,
      why: 'Forty-two points and a 15th-place finish — the club’s lowest finish since 1974.',
      source: { href: 'seasons.html', label: 'Season by season' }
    },
    {
      q: 'Which player made the most appearances for the club?',
      a: ['Gary Neville', 'Ryan Giggs', 'Paul Scholes', 'Bobby Charlton'],
      correct: 1,
      why: 'Ryan Giggs made 963 appearances between 1991 and 2014, and is the only player to appear in every Premier League title season.',
      source: { href: 'legends.html', label: 'The full index' }
    },
    {
      q: 'In which year was the club renamed Manchester United?',
      a: ['1878', '1888', '1902', '1910'],
      correct: 2,
      why: '1902: bankrupt and days from folding, Newton Heath were rescued, renamed and given the red shirts.',
      source: { href: 'index.html#eras', label: 'The nine moments' }
    },
    {
      q: 'Which trophy did United win in 2017 to complete the set of UEFA’s three main club competitions?',
      a: ['Champions League', 'Cup Winners’ Cup', 'Europa League', 'Super Cup'],
      correct: 2,
      why: 'The Europa League in Stockholm. Together with the European Cup and the Cup Winners’ Cup, it made United one of only five clubs to have won all three.',
      source: { href: 'trophies.html', label: 'The cabinet' }
    },
    {
      q: 'Where did United finish in 2012–13, Ferguson’s final season?',
      a: ['1st', '2nd', '3rd', '4th'],
      correct: 0,
      why: 'First, with 89 points — a 20th league title in the manager’s last season.',
      source: { href: 'seasons.html', label: 'Season by season' }
    },
    {
      q: 'How many major trophies has the club won in total?',
      a: ['56', '61', '68', '74'],
      correct: 2,
      why: 'Sixty-eight major honours, including 21 Community Shields of which four were shared.',
      source: { href: 'trophies.html', label: 'The cabinet' }
    }
  ];

  var BEST_KEY = 'rdd-quiz-best';

  var quizHost = document.getElementById('quiz');
  var barHost = document.querySelector('[data-quiz-bar]');
  var bestEl = document.querySelector('[data-best]');

  var state = { index: 0, picked: [], answers: [] };

  /* ---- Progress bar --------------------------------------------------- */
  function renderBar() {
    barHost.innerHTML = '';
    for (var i = 0; i < QUESTIONS.length; i += 1) {
      var span = document.createElement('span');
      if (i < state.index) span.className = 'is-done';
      if (i === state.index) span.className = 'is-now';
      barHost.appendChild(span);
    }
  }

  /* ---- One question --------------------------------------------------- */
  function renderQuestion() {
    var q = QUESTIONS[state.index];
    var picked = state.answers[state.index];

    quizHost.innerHTML =
      '<div class="q">' +
        '<p class="q__meta">Question ' + (state.index + 1) + ' of ' + QUESTIONS.length + '</p>' +
        '<h2 tabindex="-1" data-q-title>' + q.q + '</h2>' +
        '<div class="answers" role="group" aria-label="Answers">' +
          q.a.map(function (text, i) {
            return '<button class="answer" type="button" data-answer="' + i + '" aria-pressed="' + (picked === i) + '">' +
              '<span class="answer__key">' + String.fromCharCode(65 + i) + '</span>' +
              '<span>' + text + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<div class="quiz-foot">' +
          '<button class="btn" type="button" data-next ' + (picked === null || picked === undefined ? 'disabled' : '') + '>' +
            (state.index === QUESTIONS.length - 1 ? 'See my score' : 'Next question') + ' <span class="arrow" aria-hidden="true">→</span>' +
          '</button>' +
          (state.index > 0 ? '<button class="btn btn--ghost" type="button" data-prev>Back</button>' : '') +
          '<p class="quiz-note" style="margin-left:auto">' + (state.index + 1) + ' / ' + QUESTIONS.length + '</p>' +
        '</div>' +
      '</div>';

    renderBar();

    Array.prototype.forEach.call(quizHost.querySelectorAll('[data-answer]'), function (btn) {
      btn.addEventListener('click', function () {
        state.answers[state.index] = Number(btn.getAttribute('data-answer'));
        renderQuestion();
      });
    });

    var next = quizHost.querySelector('[data-next]');
    next.addEventListener('click', function () {
      if (state.index === QUESTIONS.length - 1) {
        renderScore();
      } else {
        state.index += 1;
        renderQuestion();
        quizHost.querySelector('[data-q-title]').focus();
      }
    });

    var prev = quizHost.querySelector('[data-prev]');
    if (prev) {
      prev.addEventListener('click', function () {
        state.index -= 1;
        renderQuestion();
      });
    }
  }

  /* ---- Results -------------------------------------------------------- */
  function renderScore() {
    var score = QUESTIONS.reduce(function (acc, q, i) {
      return acc + (state.answers[i] === q.correct ? 1 : 0);
    }, 0);

    var best = 0;
    try {
      best = Number(localStorage.getItem(BEST_KEY) || 0);
      if (score > best) {
        localStorage.setItem(BEST_KEY, String(score));
        best = score;
      }
    } catch (e) { }

    var verdict = score === 10
      ? 'Ten out of ten. Either you were there, or you have read every page on this site.'
      : score >= 7
        ? 'A good score. The gaps will be in the seasons you did not live through.'
        : score >= 4
          ? 'Half-decent. The chart on the seasons page is the fastest way to fix the rest.'
          : 'Not a disaster — the corrections below are the point of the quiz.';

    quizHost.innerHTML =
      '<div class="score-card">' +
        '<p class="q__meta">Your score</p>' +
        '<div class="big">' + score + ' / ' + QUESTIONS.length + '</div>' +
        '<p class="lead mt-2" style="max-width:46ch">' + verdict + '</p>' +
        '<div class="quiz-foot mt-2">' +
          '<button class="btn" type="button" data-restart>Try again</button>' +
          '<p class="quiz-note" style="margin-left:auto">Best so far: ' + best + ' / ' + QUESTIONS.length + '</p>' +
        '</div>' +
        '<div class="review">' +
          QUESTIONS.map(function (q, i) {
            var right = state.answers[i] === q.correct;
            return '<div class="review__row ' + (right ? 'is-right' : 'is-wrong') + '">' +
              '<b>' + (right ? '✓ ' : '✗ ') + q.q + '</b>' +
              '<span>Your answer: ' + q.a[state.answers[i]] + (right ? '' : ' · Correct: ' + q.a[q.correct]) + '</span>' +
              '<p style="margin:.35rem 0 0;font-size:.86rem">' + q.why + ' <a href="' + q.source.href + '">' + q.source.label + ' →</a></p>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    barHost.innerHTML = '';
    for (var i = 0; i < QUESTIONS.length; i += 1) {
      var span = document.createElement('span');
      span.className = state.answers[i] === QUESTIONS[i].correct ? 'is-done' : '';
      barHost.appendChild(span);
    }

    quizHost.querySelector('[data-restart]').addEventListener('click', function () {
      state = { index: 0, picked: [], answers: [] };
      renderQuestion();
      quizHost.querySelector('[data-q-title]').focus();
    });

    showBest();
  }

  function showBest() {
    var best = 0;
    try { best = Number(localStorage.getItem(BEST_KEY) || 0); } catch (e) { }
    bestEl.textContent = best
      ? 'Your best so far: ' + best + ' out of ' + QUESTIONS.length + '. Stored in this browser only.'
      : 'Nothing is sent anywhere: the score is kept in this browser with localStorage.';
  }

  renderQuestion();
  showBest();
})();
