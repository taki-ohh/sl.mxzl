// 页内索引高亮：视口中线所在的章节，对应索引项加 .on
(() => {
  const links = [...document.querySelectorAll("[data-spy] a[href^='#']")];
  if (!links.length) return;
  const targets = links.map((a) => document.getElementById(a.getAttribute("href").slice(1)));

  const update = () => {
    const line = window.innerHeight * 0.4;
    let current = 0;
    targets.forEach((el, i) => {
      if (el && el.getBoundingClientRect().top <= line) current = i;
    });
    links.forEach((a, i) => a.classList.toggle("on", i === current));
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

// 泰坦页入场：每屏进入视口时加 .in，参数列表逐行错开
(() => {
  const titans = document.querySelectorAll(".titan");
  if (!titans.length) return;
  titans.forEach((t) => t.querySelectorAll(".spec li").forEach((li, i) => li.style.setProperty("--i", i)));
  if (!("IntersectionObserver" in window)) {
    titans.forEach((t) => t.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.35 });
  titans.forEach((t) => io.observe(t));
})();
