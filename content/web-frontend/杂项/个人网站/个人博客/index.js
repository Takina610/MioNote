// 鼠标移动光效
document.addEventListener('mousemove', (e) => {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-effect';
    cursor.style.left = e.pageX + 'px';
    cursor.style.top = e.pageY + 'px';
    document.body.appendChild(cursor);
    
    setTimeout(() => {
        cursor.remove();
    }, 1000);
});

// 文字打字机效果
const texts = document.querySelectorAll('.content1, .content2, .content3');
texts.forEach(text => {
    const originalText = text.textContent;
    text.textContent = '';
    let index = 0;
    
    function typeWriter() {
        if (index < originalText.length) {
            text.textContent += originalText.charAt(index);
            index++;
            setTimeout(typeWriter, 100);
        }
    }
    
    // 当元素进入视图时开始动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                typeWriter();
                observer.unobserve(entry.target);
            }
        });
    });
    
    observer.observe(text);
});

// 卡片3D倾斜效果
const cards = document.querySelectorAll('.content5 .left, .content5 .right');
cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
});

// 图标悬浮动画
const icons = document.querySelectorAll('.img-bz, .img-gitee, .img-github, .img-csdn');
icons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
        icon.style.transform = 'translateY(-10px) rotate(360deg)';
        icon.style.transition = 'all 0.5s ease';
    });
    
    icon.addEventListener('mouseleave', () => {
        icon.style.transform = 'translateY(0) rotate(0)';
    });
});

// 滚动视差效果
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const picture = document.querySelector('.picture');
    const content = document.querySelector('.container');
    
    picture.style.transform = `translateY(${scrolled * 0.3}px)`;
    content.style.transform = `translateY(${scrolled * 0.1}px)`;
});

// 添加鼠标光标效果的样式
const style = document.createElement('style');
style.textContent = `
    .cursor-effect {
        position: fixed;
        pointer-events: none;
        width: 10px;
        height: 10px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: cursorAnim 1s linear forwards;
        z-index: 9999;
    }
    
    @keyframes cursorAnim {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
        }
        100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 