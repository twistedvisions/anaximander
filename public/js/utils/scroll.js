define([], function () {

  return {
    intoView: function (el, parent, offset) {
      offset = offset || 0;
      var top = el.position().top;
      var height = el.height();
      if ((top < 0) || ((top + height) > parent.innerHeight())) {
        parent.scrollTop(parent.scrollTop() + el.position().top - offset);
      }
    }
  };
});