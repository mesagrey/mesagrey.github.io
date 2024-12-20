---
layout: default
title: blog
---

# Album Reviews

{% for post in site.posts %}
  <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
  <p>{{ post.excerpt }}...</p>
  <a href="{{ post.url }}">Read more</a>
{% endfor %}
