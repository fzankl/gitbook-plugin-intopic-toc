/*global anchors,Gumshoe*/
let selector;
let label;
let isVisibleByDefault;

require(['gitbook', 'jQuery'], function (gitbook, $) {
  anchors.options = {
    placement: 'left'
  };

  gitbook.events.bind('start', function (e, config) {
    const configuration = config['intopic-toc'];
    selector = configuration.selector;
    isVisibleByDefault = configuration.visible;
    label = configuration.label;

    // Label can be language specific and could be specified via user configuration
    if (typeof label === 'object') {
      const language = gitbook.state.innerLanguage;

      if (language && label.hasOwnProperty(language)) {
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
    anchors.add(selector);

    const isVisible = (isVisibleByDefault || gitbook.state.page.isTocVisible) && gitbook.state.page.isTocVisible !== false;

    if (anchors.elements.length > 1 && isVisible) {
      const navigation = buildNavigation(anchors.elements);

      const section = document.body.querySelector('.page-wrapper');
      section.appendChild(navigation, section.firstChild);

      new Gumshoe('.intopic-toc ol a', {
        container: $('.book-body .body-inner')[0],
        navClass: 'selected',
        contentClass: 'selected',
        offset: function() {
          return anchors.elements[0].getBoundingClientRect().height;
        },
        reflow: true
      });
    }
  });
});

function buildNavigation(elements) {
  const navigation = document.createElement('nav');
  navigation.className = 'intopic-toc';

  const heading = document.createElement('h3');
  heading.innerText = label;
  navigation.appendChild(heading);

  const container = document.createElement('ol');
  navigation.appendChild(container);

  for (let i = 0; i < elements.length; i++) {
    const text = elements[i].textContent;
    const href = elements[i].querySelector('.anchorjs-link').getAttribute('href');

    const item = document.createElement('li');

    if (i === 0) {
      item.classList.add('selected');
    }

    const anchor = document.createElement('a');
    anchor.text = text;
    anchor.href = href;

    item.appendChild(anchor);
    container.appendChild(item);
  }

  return navigation;
}
