define([], function () {

  return {
    intoView: function (el, parent, offset) {
      offset = offset || 0;
      var top = el.position().top;
      if ((top < 0) || (top > parent.height())) {
        parent.scrollTop(parent.scrollTop() + el.position().top - offset);
      }
    }
  };
});