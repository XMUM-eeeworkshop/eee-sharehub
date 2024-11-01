document.addEventListener("DOMContentLoaded", async function () {
  const data = await fetch("course.json").then((response) => response.json());
  const courseContainer = document.querySelector(".course-container");
  const searchInput = document.querySelector(".search-input");
  const suggestionsBox = document.querySelector(".suggestions");

  // 获取当前页面的年级，例如从 "year1.html" 中提取出 "1"
  const currentGrade = parseInt(
    window.location.pathname.match(/year(\d)/)[1],
    10
  );

  // 筛选并排序出当前页面的年级课程
  const currentGradeCourses = data
    .filter((course) => course.grade === currentGrade)
    .sort((a, b) => a.term - b.term || a.code.localeCompare(b.code));

  // 动态创建课程块
  currentGradeCourses.forEach((course) => {
    const semester = `SEM${course.term}`;
    const referencesHTML = course.references
      .map((ref) =>
        ref.link
          ? `<a href="${ref.link}" target="_blank">${ref.title}</a>`
          : `<span>${ref.title}</span>`
      )
      .join("<br>");

    const readingsHTML = course.readings
      .map((reading) =>
        reading.link
          ? `<a href="${reading.link}" target="_blank">${reading.title}</a>`
          : `<span>${reading.title}</span>`
      )
      .join("<br>");

    const toolsHTML = course.tools
      .map((tool) =>
        tool.link
          ? `<a href="${tool.link}" target="_blank">${tool.title}</a>`
          : `<span>${tool.title}</span>`
      )
      .join("<br>");

    const courseSection = document.createElement("div");
    courseSection.classList.add("course-section");
    courseSection.setAttribute("data-semester", semester);
    courseSection.setAttribute("data-code", course.code);
    courseSection.innerHTML = `
            <div class="course-header">
                <div class="course-info">
                    <img class="course-image" src="${course.image}" alt="Course Image" />
                    <h1 class="course-title">${course.code} ${course.name}</h1>
                </div>
                <button class="toggle-button">Show details</button>
            </div>
            <div class="expandable-content">
                <p><strong>Reference Books:</strong><br>${referencesHTML}</p>
                <p><strong>Further Readings:</strong><br>${readingsHTML}</p>
                <p><strong>Tools Needed:</strong><br>${toolsHTML}</p>
            </div>
        `;
    courseContainer.appendChild(courseSection);
  });

  // 全局搜索功能
  searchInput.addEventListener("input", function () {
    const query = searchInput.value.toLowerCase();
    suggestionsBox.innerHTML = "";
    if (query) {
      const filteredCourses = data.filter(
        (course) =>
          course.name.toLowerCase().includes(query) ||
          course.code.toLowerCase().includes(query)
      );
      filteredCourses.forEach((course) => {
        const suggestion = document.createElement("div");
        suggestion.textContent = `Year ${course.grade}, SEM${course.term} - ${course.code} ${course.name}`;

        // 点击建议后跳转并传递参数
        suggestion.addEventListener("click", () => {
          const targetURL = `year${course.grade}.html?term=${course.term}&code=${course.code}`;
          window.location.href = targetURL;
        });

        suggestionsBox.appendChild(suggestion);
      });
      suggestionsBox.style.display = "block";
    } else {
      suggestionsBox.style.display = "none";
    }
  });

  // 点击搜索框外部时隐藏建议框
  document.addEventListener("click", function (e) {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = "none";
    }
  });

  // 展开和折叠功能
  function setupToggleButtons() {
    document.querySelectorAll(".toggle-button").forEach((button) => {
      button.addEventListener("click", function () {
        const expandableContent = this.parentElement.nextElementSibling;
        if (expandableContent.style.maxHeight) {
          expandableContent.style.maxHeight = null;
          this.textContent = "Show details";
        } else {
          expandableContent.style.maxHeight =
            expandableContent.scrollHeight + "px";
          this.textContent = "Hide details";
        }
      });
    });
  }
  setupToggleButtons();

  // 默认显示第一个学期的课程
  const paginationLinks = document.querySelectorAll(".pagination a");
  paginationLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (link.textContent.trim() === "HOME") return; // 如果是主页按钮则跳过

      e.preventDefault();

      // 折叠所有已展开的课程内容
      document.querySelectorAll(".expandable-content").forEach((content) => {
        content.style.maxHeight = null;
      });
      document.querySelectorAll(".toggle-button").forEach((button) => {
        button.textContent = "Show details";
      });

      paginationLinks.forEach((el) => el.classList.remove("active"));
      this.classList.add("active");

      const selectedSemester = this.textContent.trim();
      document.querySelectorAll(".course-section").forEach((section) => {
        section.style.display =
          section.getAttribute("data-semester") === selectedSemester
            ? "block"
            : "none";
      });

      // 自动滚动到顶部
      window.scrollTo(0, 0);
    });
  });

  document.querySelector(".pagination a.active").click();

  // 动态调整 yOffset
  function calculateYOffset() {
    // 基础偏移量，可根据需要调整
    const baseYOffset = -120;

    // 根据窗口高度调整偏移量比例
    const scale = window.innerHeight * 0.05;
    return baseYOffset - scale;
  }

  // 滚动到目标课程位置
  function scrollToTarget(targetCourse) {
    const yOffset = calculateYOffset();
    const yPosition =
      targetCourse.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({
      top: yPosition,
      behavior: "smooth",
    });
  }

  // URL 参数自动展开对应课程并置顶
  const urlParams = new URLSearchParams(window.location.search);
  const term = urlParams.get("term");
  const code = urlParams.get("code");

  if (term && code) {
    paginationLinks.forEach((link) => {
      if (link.textContent.trim() === `SEM${term}`) {
        link.classList.add("active");
        link.click();
      }
    });

    // 等待页面加载完成后自动展开指定课程并置顶
    const targetCourseInterval = setInterval(() => {
      const targetCourse = Array.from(
        document.querySelectorAll(".course-section")
      ).find((course) =>
        course.querySelector(".course-title").textContent.includes(code)
      );
      if (targetCourse) {
        clearInterval(targetCourseInterval); // 找到后清除定时器

        // 使用动态偏移量滚动到目标位置
        scrollToTarget(targetCourse);

        // 展开课程内容
        const toggleButton = targetCourse.querySelector(".toggle-button");
        if (toggleButton && toggleButton.textContent === "Show details") {
          toggleButton.click();
        }
      }
    }, 100);
  }
});
