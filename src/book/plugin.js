/*global anchors,Gumshoe*/
let configuration;
let label;

require(['gitbook', 'jQuery'], function (gitbook, $) {
  anchors.options = {
    placement: 'left'
  };

  gitbook.events.bind('start', function (e, config) {
    configuration = config['intopic-toc'];
    label = configuration.label;

    // Label can be language specific and could be specified via user configuration
    if (typeof label === 'object') {
      const language = gitbook.state.innerLanguage;

      if (language && Object.prototype.hasOwnProperty.call(label, language)) {
        label = label[language];
      } else {
        label = '';
      }
    }

    // Hide navigation if a search is ative
    const $bookSearchResults = $('#book-search-results');

    const observer = new MutationObserver(() => {
      if ($bookSearchResults.hasClass('open')) {
        $('.intopic-toc').hide();
      }
      else {
        $('.intopic-toc').show();
      }
    });

    observer.observe($bookSearchResults[0], { attributes: true });
  });

  gitbook.events.bind('page.change', function () {
    anchors.removeAll();
    anchors.add(configuration.selector);

    const isVisible = (configuration.visible || gitbook.state.page.isTocVisible) && gitbook.state.page.isTocVisible !== false;

    const mode = configuration.mode;
    const maxDepth = Number(configuration.maxDepth);
    const isCollapsed = Boolean(configuration.isCollapsed);
    const isScrollspyActive = Boolean(configuration.isScrollspyActive);

    if (anchors.elements.length > 1 && isVisible) {
      const navigation = buildNavigation(anchors.elements, label, mode, maxDepth, isCollapsed);

      const section = document.body.querySelector('.page-wrapper');
      section.appendChild(navigation, section.firstChild);

      if (isScrollspyActive) {
        const container = $('.book-body .body-inner')[0];

        new Gumshoe('.intopic-toc a', {
          container: container,
          navClass: 'active',
          contentClass: 'active',
          nested: true,
          offset: container.offsetHeight / 2,
          reflow: true
        });
      }
    }
  });
});

function getAnchorLevel(element) {
  return parseInt(element.tagName.charAt(1), 10);
}

function createNavList(level) {
  const navList = document.createElement('ul');
  navList.classList.add('nav');
  navList.classList.add('navbar-nav');
  navList.classList.add(`level-${level}`);

  return navList;
}

function createChildNavList(parent, level) {
  const childList = createNavList(level);
  parent.append(childList);

  return childList;
}

function createNavItem(text, href) {
  const anchor = document.createElement('a');
  anchor.classList.add('nav-link');
  anchor.text = text;
  anchor.href = href;

  const item = document.createElement('li');
  item.appendChild(anchor);

  return item;
}

/**
 * Find the index of first heading level (`<h1>`, then `<h2>`, etc.) that has more than one element.
 * Defaults to 0 for the first element.
 *
 * @param {*} elements Headings identified via selector config property
 */
function getStartingElementIndex(elements) {
  for (let i = 1; i <= 6; i++) {
    const headings = elements.filter(x => x.tagName.toLowerCase() === `h${i}`);

    if (headings.length > 1) {
      return elements.indexOf(headings[0]);
    }
  }

  return 0;
}

function buildNavigation(elements, header, mode, maxDepth, isCollapsed) {
  const indentItems = mode.toLowerCase() === 'nested';
  const navigation = document.createElement('nav');
  navigation.className = `intopic-toc ${mode}`;

  if (isCollapsed) {
    navigation.className += ' collapsed';
  }

  const heading = document.createElement('h3');
  heading.innerText = header;
  navigation.appendChild(heading);

  const containers = {};
  containers[0] = createChildNavList(navigation, 0);

  const startingElementIndex = getStartingElementIndex(elements);
  const startingLevel = getAnchorLevel(elements[startingElementIndex]);

  let previousItem;
  let previousLevel = -1;

  for (let i = startingElementIndex; i < elements.length; i++) {
    const currentLevel = getAnchorLevel(elements[i]) - startingLevel;

    if (currentLevel >= maxDepth) {
      continue;
    }

    if (previousLevel === -1) {
      previousLevel = currentLevel;
    }

    if (indentItems) {
      if (currentLevel < previousLevel) {
        for (let i = previousLevel; i > currentLevel; i--) {
          delete containers[i];
        }
      }

      if (!containers[currentLevel]) {
        containers[currentLevel] = createChildNavList(previousItem, currentLevel);
      }
    }

    const item = createNavItem(
      elements[i].textContent,
      elements[i].querySelector('.anchorjs-link').getAttribute('href'));

    containers[indentItems ? currentLevel : 0].appendChild(item);

    previousItem = item;
    previousLevel = currentLevel;
  }

  return navigation;
}
