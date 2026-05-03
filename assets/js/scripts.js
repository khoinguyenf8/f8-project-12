const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

/**
 * Hàm tải template
 *
 * Cách dùng:
 * <div id="parent"></div>
 * <script>
 *  load("#parent", "./path-to-template.html");
 * </script>
 */
function load(selector, path) {
    const cached = localStorage.getItem(path);
    if (cached) {
        $(selector).innerHTML = cached;
    }

    fetch(path)
        .then((res) => res.text())
        .then((html) => {
            if (html !== cached) {
                $(selector).innerHTML = html;
                localStorage.setItem(path, html);
            }
        })
        .finally(() => {
            window.dispatchEvent(new Event("template-loaded"));

             if (typeof AOS !== "undefined") {
                // reset toàn bộ → coi như chưa animate
                AOS.refreshHard(); 


                // cập nhật vị trí, GIỮ trạng thái đã animate
                // AOS.refresh();
            }
        });
}

/**
 * Hàm kiểm tra một phần tử
 * có bị ẩn bởi display: none không
 */
function isHidden(element) {
    if (!element) return true;

    if (window.getComputedStyle(element).display === "none") {
        return true;
    }

    let parent = element.parentElement;
    while (parent) {
        if (window.getComputedStyle(parent).display === "none") {
            return true;
        }
        parent = parent.parentElement;
    }

    return false;
}

/**
 * Hàm buộc một hành động phải đợi
 * sau một khoảng thời gian mới được thực thi
 */
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}

/**
 * Hàm tính toán vị trí arrow cho dropdown
 *
 * Cách dùng:
 * 1. Thêm class "js-dropdown-list" vào thẻ ul cấp 1
 * 2. CSS "left" cho arrow qua biến "--arrow-left-pos"
 */
const calArrowPos = debounce(() => {
    if (isHidden($(".js-dropdown-list"))) return;

    const items = $$(".js-dropdown-list > li");

    items.forEach((item) => {
        const arrowPos = item.offsetLeft + item.offsetWidth / 2;
        item.style.setProperty("--arrow-left-pos", `${arrowPos}px`);
    });
});

// Tính toán lại vị trí arrow khi resize trình duyệt
window.addEventListener("resize", calArrowPos);

// Tính toán lại vị trí arrow sau khi tải template
window.addEventListener("template-loaded", calArrowPos);

/**
 * Giữ active menu khi hover
 *
 * Cách dùng:
 * 1. Thêm class "js-menu-list" vào thẻ ul menu chính
 * 2. Thêm class "js-dropdown" vào class "dropdown" hiện tại
 *  nếu muốn reset lại item active khi ẩn menu
 */
window.addEventListener("template-loaded", handleActiveMenu);

function handleActiveMenu() {
    const dropdowns = $$(".js-dropdown");
    const menus = $$(".js-menu-list");
    const activeClass = "menu-column__item--active";

    const removeActive = (menu) => {
        menu.querySelector(`.${activeClass}`)?.classList.remove(activeClass);
    };

    const init = () => {
        menus.forEach((menu) => {
            const items = menu.children;
            if (!items.length) return;

            removeActive(menu);
            if (window.innerWidth > 991) items[0].classList.add(activeClass);

            Array.from(items).forEach((item) => {
                item.onmouseenter = () => {
                    if (window.innerWidth <= 991) return;
                    removeActive(menu);
                    item.classList.add(activeClass);
                };
                item.onclick = () => {
                    if (window.innerWidth > 991) return;
                    removeActive(menu);
                    item.classList.add(activeClass);
                    item.scrollIntoView();
                };
            });
        });
    };

    init();

    dropdowns.forEach((dropdown) => {
        dropdown.onmouseleave = () => init();
    });
}

/**
 * JS toggle
 * Dùng để active vào 1 button để mở dropdown
 * Cách dùng:
 * <button class="js-toggle" toggle-target="#box">Click</button>
 * <div id="box">Content show/hide</div>
 * Thêm đoạn script vào cuối thẻ body để kích hoạt đoạn script
 * <script>
        window.dispatchEvent(new Event("temple-loaded"));
    </script>
 */
window.addEventListener("template-loaded", initJsToggle);

function initJsToggle() {
  $$(".js-toggle").forEach((button) => {
    const target = button.getAttribute("toggle-target");
    if (!target) {
      document.body.innerText = `Cần thêm toggle-target cho: ${button.outerHTML}`;
      return;
    }

    button.onclick = (e) => {
      e.preventDefault();

      if (!$(target)) {
        return (document.body.innerText = `Không tìm thấy phần tử "${target}"`);
      }

      const isHidden = $(target).classList.contains("hide");

      requestAnimationFrame(() => {
        $(target).classList.toggle("hide", !isHidden);
        $(target).classList.toggle("show", isHidden);
      });

      // 🟡 Thêm đoạn xử lý click bên ngoài để đóng dropdown
      const onClickOutside = (event) => {
        if (
          !button.contains(event.target) &&
          !$(target).contains(event.target)
        ) {
          const stillVisible = !$(target).classList.contains("hide");
          if (stillVisible) {
            button.click(); // gọi lại button.click() để chạy lại đúng logic toggle hiện tại
          }
          document.removeEventListener("click", onClickOutside);
        }
      };

      // Đăng ký listener sau 1 tick để tránh bắt sự kiện click hiện tại
      setTimeout(() => {
        document.addEventListener("click", onClickOutside);
      }, 0);
    };

    // GIỮ NGUYÊN phần xử lý click ra khỏi content
    document.onclick = function (e) {
      if (!e.target.closest(target)) {
        const isHidden = $(target).classList.contains("hide");
        if (!isHidden) {
          button.click();
        }
      }
    };
  });
}



// Responsive phần Navbar #4
// Dóng mở menu navbar , thêm class 'js-dropdown-list' vào thẻ ul, khi active vào thẻ li thì sẽ
// thêm class li+--active vào. rồi css phù hợp
window.addEventListener("template-loaded", () => {
    const links = $$(".js-dropdown-list > li > a");

    links.forEach((link) => {
        link.onclick = () => {
            if (window.innerWidth > 991) return;
            const item = link.closest("li");
            item.classList.toggle("navbar__item--active");
        };
    });
});

// Đoạn js này giống trên , nó sẽ thêm class có đuôi --current vào thẻ li
window.addEventListener("template-loaded", () => {
  const links = $$(".js-form__option-list > li");

  links.forEach((link) => {
    link.onclick = () => {
      // 1. Xóa class active khỏi TẤT CẢ các thẻ li
      links.forEach((otherLink) => {
        otherLink.classList.remove("form__option-item--current");
      });

      // 2. Thêm class active vào thẻ li hiện tại được click
      link.classList.add("form__option-item--current");
    };
  });
});

// Đoạn js ở bài 57.61
// Js chuyển trang các thẻ con trong thẻ cha , muốn dùng lại đoạn Js thì thay các class phù hợp
// Dùng cho thẻ ul chứa nhiều thẻ li , hoặc thẻ div chứa nhiều thẻ div con
// B1: Thêm class js-tabs vào thẻ cha của thẻ ul(có thể đỏi tên class này), tức là thẻ bao bọc cả ul và nội dung của các thẻ li, vd
// <div class="js-tabs">
    //  <ul>
            // <li></li>
            // <li></li>
            // <li></li>
    //  </ul>

//      <div class="content-li-1"></div>
//      <div class="content-li-2"></div>
//      <div class="content-li-3"></div>
// </div>
// Các chữ màu cam là các class 
// prod-tab__item: các thẻ li hoặc thẻ con của thẻ cha muốn chuyển trang
// prod-tab__content: các trang riêng, nội dung riêng biệt của các thẻ li , thẻ con
// --current:là modifi của các thẻ li hoặc thẻ con , vd:prod-tab__item--current 
// modifi này dùng để css ẩn hiện của nội dung của các thẻ li hoặc thẻ con
window.addEventListener("template-loaded", () => {
    const tabsSelector = "product-tab__item";
    const contentsSelector = "product-tab__content";

    const tabActive = `${tabsSelector}--current`;
    const contentActive = `${contentsSelector}--current`;

    const tabContainers = $$(".js-tabs");
    tabContainers.forEach((tabContainer) => {
        const tabs = tabContainer.querySelectorAll(`.${tabsSelector}`);
        const contents = tabContainer.querySelectorAll(`.${contentsSelector}`);
        tabs.forEach((tab, index) => {
            tab.onclick = () => {
                tabContainer.querySelector(`.${tabActive}`)?.classList.remove(tabActive);
                tabContainer.querySelector(`.${contentActive}`)?.classList.remove(contentActive);
                tab.classList.add(tabActive);
                contents[index].classList.add(contentActive);
            };
        });
    });
});

// Dùng cho  Dark_mode/Light_mode
// Đoạn js sẽ đổi chữ Drak-mode thành Light_mode và ngc lại
// Dùng riêng thẻ span để bao bọc dùng chữ Dark-mode hoặc Light-mode vì đoạn js này dưa vào thẻ span
// Thêm id "switch-theme-btn" vào thẻ để nhấn 
// 57.92
window.addEventListener("template-loaded", () => {
    const switchBtn = document.querySelector("#switch-theme-btn");
    if (switchBtn) {
        switchBtn.onclick = function () {
            const isDark = localStorage.dark === "true";
            document.querySelector("html").classList.toggle("dark", !isDark);
            localStorage.setItem("dark", !isDark);
            switchBtn.querySelector("span").textContent = isDark ? "Dark mode" : "Light mode";
        };
        const isDark = localStorage.dark === "true";
        switchBtn.querySelector("span").textContent = isDark ? "Light mode" : "Dark mode";
    }
});

const isDark = localStorage.dark === "true";
document.querySelector("html").classList.toggle("dark", isDark);


