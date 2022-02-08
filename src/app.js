/* eslint-disable no-use-before-define */
import { uniqueId } from 'lodash-es';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import _ from 'lodash';

export default (i18nInstance) => {
  const state = {
    feeds: [],
    posts: [],
    ui: {
      condition: 'default',
      lastMessage: '',
      viewedPosts: [],
    },
  };

  const viewPost = (e) => {
    // e.preventDefault();
    const { id } = e.target.dataset;
    watchedState.ui.viewedPosts = _.uniq([...watchedState.ui.viewedPosts, id]);
    console.log(watchedState);
  };

  const changeCondition = (condition, message = '') => {
    watchedState.ui.condition = condition;
    watchedState.ui.lastMessage = message;
  };

  const watchedState = onChange(
    state,
    (path, value) => {
      if (path === 'ui.condition') {
        if (value === 'success') {
          clearInput();
        }
        renderInputStatus(watchedState.ui.condition);
      }
      if (path === 'ui.viewedPosts') {
        renderPosts(watchedState.posts, watchedState.feeds, watchedState.ui.viewedPosts, viewPost);
      }
      if (path === 'ui.lastMessage') {
        renderFlashMessage(watchedState.ui);
      }
      if (path === 'feeds') {
        renderFeeds(watchedState.feeds);
      }
      if (path === 'posts') {
        renderPosts(watchedState.posts, watchedState.feeds, watchedState.ui.viewedPosts, viewPost);
      }
    },
  );

  const form = document.querySelector('form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get('url');

    const schema = yup.object().shape({
      url: yup.string(i18nInstance.t('yup.string')).required(i18nInstance.t('yup.required')).url(i18nInstance.t('yup.invalid_url')),
    });

    const promise = schema
      .validate({
        url,
      })
      .then(() => {
        changeCondition('default');
      })
      .catch((err) => {
        changeCondition('userError', err.message);
      })
      .then(() => {
        if (watchedState.ui.condition === 'default') {
          const encodedUrl = encodeURIComponent(url);
          const response = axios.get(`https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodedUrl}`);
          return response;
        }
        return null;
      })
      .catch(() => {
        changeCondition('otherError', i18nInstance.t('networkError'));
      })
      .then((response) => {
        if (watchedState.ui.condition === 'default') {
          const newFeed = parse(response.data.contents);
          const feedId = uniqueId();
          if (isFeedExists(watchedState.feeds, newFeed)) {
            changeCondition('otherError', i18nInstance.t('already_exists'));
            return;
          }
          watchedState.feeds = [...watchedState.feeds, {
            id: feedId,
            title: newFeed.title,
            description: newFeed.description,
            link: newFeed.link,
          }];
          watchedState.posts = [...watchedState.posts, ...newFeed.posts.map((post) => ({
            feedId,
            id: uniqueId(),
            guid: post.guid,
            title: post.title,
            description: post.description,
            link: post.link,
          }))];
          changeCondition('success', i18nInstance.t('success'));
        }
      })
      .catch(() => {
        changeCondition('userError', i18nInstance.t('parseError'));
      })
      .then(() => {
        const encodedUrl = encodeURIComponent(url);
        const handler = () => axios.get(`https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodedUrl}`)
          .then((response) => {
            const updatedFeed = parse(response.data.contents);
            const feedId = _.find(watchedState.feeds, { link: updatedFeed.link }).id;

            const newPosts = updatedFeed.posts
              .filter((post) => !(_.find(watchedState.posts, { link: post.link })));

            watchedState.posts = [...watchedState.posts, ...newPosts.map((post) => ({
              feedId,
              id: uniqueId(),
              guid: post.guid,
              title: post.title,
              description: post.description,
              link: post.link,
            }))];
          })
          .catch(() => {
            // Do nothing!
            console.log('error');
          })
          .then(() => {
            setTimeout(handler, 5000);
          });
        setTimeout(handler, 5000);
      });
    return promise;
  });
};

const parse = (xml) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  if (!doc.querySelector('rss')) {
    throw new Error('ParseError');
  }
  const feedTitle = removeCdataFromString(doc.querySelector('rss channel title').innerHTML);
  const feedDesctiption = removeCdataFromString(doc.querySelector('rss channel description').innerHTML);
  const feedLink = removeCdataFromString(doc.querySelector('rss channel link').innerHTML);

  const posts = [...doc.querySelectorAll('rss channel item')].map((post) => {
    const title = removeCdataFromString(post.querySelector('title').innerHTML);
    const description = removeCdataFromString(post.querySelector('description').innerHTML);
    const guid = removeCdataFromString(post.querySelector('guid').innerHTML);
    const link = removeCdataFromString(post.querySelector('link').innerHTML);
    return {
      title, description, guid, link,
    };
  });
  return {
    title: feedTitle,
    description: feedDesctiption,
    link: feedLink,
    posts,
  };
};

const removeCdataFromString = (str) => str.replace('<![CDATA[', '').replace(']]>', '');

const renderFeeds = (feeds) => {
  const feedDiv = document.querySelector('.feeds');
  feedDiv.innerHTML = '';
  if (feedDiv.length === 0) {
    return;
  }

  const cardDiv = document.createElement('div');
  cardDiv.classList.add('card', 'border-0');

  const cardBodyDiv = document.createElement('div');
  cardBodyDiv.classList.add('card-body');

  const cardTitleH2 = document.createElement('h2');
  cardTitleH2.classList.add('card-title', 'h4');
  cardTitleH2.innerHTML = 'Фиды';

  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  feeds.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    ul.append(li);

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.innerHTML = feed.title;
    li.append(h3);

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.innerHTML = feed.description;
    li.append(p);
  });

  feedDiv.append(cardDiv);
  cardDiv.append(cardBodyDiv);
  cardDiv.append(ul);
  cardBodyDiv.append(cardTitleH2);
};

const renderPosts = (posts, feeds, viewedPosts, viewPost) => {
  const postDiv = document.querySelector('.posts');
  postDiv.innerHTML = '';
  if (feeds.length === 0) {
    return;
  }

  const cardDiv = document.createElement('div');
  cardDiv.classList.add('card', 'border-0');

  const cardBodyDiv = document.createElement('div');
  cardBodyDiv.classList.add('card-body');

  const cardTitleH2 = document.createElement('h2');
  cardTitleH2.classList.add('card-title', 'h4');
  cardTitleH2.innerHTML = 'Посты';

  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  posts.forEach((post) => {
    const isPostViewed = (id) => _.includes(viewedPosts, id);

    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    ul.append(li);

    const a = document.createElement('a');
    a.setAttribute('data-id', post.id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener norefferer');
    a.href = post.link;

    if (isPostViewed(post.id)) {
      a.classList.add('fw-normal', 'link-secondary');
    } else {
      a.classList.add('fw-bold');
    }
    a.innerHTML = post.title;
    li.append(a);

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.innerHTML = 'Просмотр';
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPost = _.find(posts, { id: post.id });
      const modalDiv = document.querySelector(e.target.getAttribute('data-bs-target'));
      modalDiv.querySelector('.modal-title').textContent = targetPost.title;
      modalDiv.querySelector('.modal-body').textContent = targetPost.description;
      modalDiv.querySelector('.full-article').href = targetPost.link;

      modalDiv.classList.add('show');
      modalDiv.style.display = 'block';
      modalDiv.querySelector('[data-bs-dismiss="modal"]').addEventListener('click', (e2) => {
        e2.preventDefault();
        modalDiv.classList.remove('show');
        modalDiv.style.display = 'none';
      });
    });

    a.addEventListener('click', viewPost);
    button.addEventListener('click', viewPost);

    li.append(button);
  });

  postDiv.append(cardDiv);
  cardDiv.append(cardBodyDiv);
  cardDiv.append(ul);
  cardBodyDiv.append(cardTitleH2);
};

const renderInputStatus = (condition) => {
  const input = document.querySelector('#url-input');
  if (condition === 'userError') {
    input.classList.add('is-invalid');
  } else {
    input.classList.remove('is-invalid');
  }
};

const renderFlashMessage = (ui) => {
  const styles = {
    default: 'text-success',
    success: 'text-success',
    userError: 'text-danger',
    otherError: 'text-danger',
  };
  const feedback = document.querySelector('p.feedback');
  feedback.classList.remove('text-danger', 'text-success');
  feedback.classList.add(styles[ui.condition]);
  feedback.textContent = ui.lastMessage;
};

// eslint-disable-next-line max-len
const isFeedExists = (feeds, newFeed) => (feeds.reduce((acc, feed) => ((feed.link === newFeed.link && feed.title === newFeed.title) ? true : acc), false));

const clearInput = () => {
  const input = document.querySelector('#url-input');
  input.value = '';
  input.focus();
};
