import { Sprite } from './sprite/base';
import { TypeImageInfo } from './types';

/**
 * 返回当前平台
 */
export function getPlatform() {
    if (navigator.platform === 'Win32' || navigator.platform === 'Windows') {
        return 'win';
    }

    if (
        navigator.platform === 'Mac68K' ||
        navigator.platform === 'MacPPC' ||
        navigator.platform === 'Macintosh' ||
        navigator.platform === 'MacIntel'
    ) {
        return 'mac';
    }

    return '';
}

let ctx: CanvasRenderingContext2D;

/**
 * 返回canvas context
 */
export function getCanvasCtx() {
    if (!ctx) {
        const canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    return ctx;
}

export const checkStrReg = /^[ ]*$/; // filter all space or empty

/**
 * 防抖
 */
export function debouce(cb: Function, timeout = 16) {
    let isPending = false;

    return (...args: any[]) => {
        if (isPending) {
            return;
        }

        isPending = true;

        cb(...args);

        setTimeout(() => {
            isPending = false;
        }, timeout);
    };
}

/**
 * 预加载图片
 */
export function preLoadImages(imgUrl: string[], crossOrigin?: any): Promise<HTMLImageElement[]> {
    const promiseList: Promise<HTMLImageElement>[] = imgUrl.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute('crossorigin', crossOrigin);
            img.src = url;
            img.onload = () => {
                const { width, height } = img;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                try {
                    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL();
                    const newImg = new Image();
                    newImg.src = dataUrl;
                    newImg.onload = () => resolve(newImg);
                    newImg.onerror = reject;
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = reject;
        });
    });

    return Promise.all(promiseList);
}

/**
 * 获取点击事件触发坐标
 */
export function getEventPoint(event: React.MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const eventX = event.clientX - rect.left - (rect.width - canvas.width) / 2;
    const eventY = event.clientY - rect.top - (rect.height - canvas.height) / 2;

    return {
        eventX,
        eventY,
    };
}

/**
 * 检测是否命中精灵
 */
export function hitSprite(drawList: Sprite[], event: { x: number; y: number }) {
    return drawList.filter(item => item.isHit(event.x, event.y));
}

/**
 * 检测绘制区域是否超出
 */
export function outArea(canvasSize: TypeImageInfo, el: Sprite) {
    const { x, y, width, height } = el;
    const reset = { x, y };

    if (x + width > canvasSize.width) {
        reset.x = canvasSize.width - width;
    }

    if (y + height > canvasSize.height) {
        reset.y = canvasSize.height - height;
    }

    if (x <= 0) {
        reset.x = 0;
    }

    if (y <= 0) {
        reset.y = 0;
    }

    return reset;
}

/**
 * 数字保留两位小数
 */
export function fixNumber(num: number) {
    return Math.round(num);
}

/**
 * 实际坐标转画布坐标
 */
export function realPos2CtxPos(
    x: number,
    y: number,
    width: number,
    height: number,
    imageInfo: TypeImageInfo,
    originImageInfo: TypeImageInfo
) {
    const { width: originImageInfoWidth, height: originImageInfoHeight } = originImageInfo;
    const { width: imageInfoWidth, height: imageInfoHeight } = imageInfo;

    x = (x / originImageInfoWidth) * imageInfoWidth;
    y = (y / originImageInfoHeight) * imageInfoHeight;
    width = (width / originImageInfoWidth) * imageInfoWidth;
    height = (height / originImageInfoHeight) * imageInfoHeight;

    return { x, y, width, height };
}

/**
 * 将度数进行统一360内转化
 * -90 =>  270
 * 450 => 90
 */
export const trimDeg = (deg: number) => {
    if (deg < 0) {
        deg = (deg % 360) + 360;
    } else {
        deg %= 360;
    }
    return deg;
};

/**
 * 获取4个方向上的图片
 * 0: 原图
 * 90: 旋转90度
 * 180: 旋转180度
 * 270: 旋转270度
 */
type ImgsType = {
    0: HTMLImageElement;
    90: HTMLImageElement;
    180: HTMLImageElement;
    270: HTMLImageElement;
};
export const getRotateImages = (img: HTMLImageElement): ImgsType => {
    const { width, height } = img;
    const canvas = document.createElement('canvas');

    const imgs: ImgsType = {
        0: img,
    } as ImgsType;

    const getNewImg = (url: string) => {
        const newImg = new Image();
        newImg.src = url;
        return newImg;
    };

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    /* 旋转90度 */
    canvas.width = height;
    canvas.height = width;
    ctx.translate(height, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, 0, 0, width, height);
    imgs[90] = getNewImg(canvas.toDataURL());
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, height, width);

    /* 旋转180度 */
    canvas.width = width;
    canvas.height = height;
    ctx.translate(width, height);
    ctx.rotate(Math.PI);
    ctx.drawImage(img, 0, 0, width, height);
    imgs[180] = getNewImg(canvas.toDataURL());
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    /* 旋转270度 */
    canvas.width = height;
    canvas.height = width;
    ctx.translate(0, width);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(img, 0, 0, width, height);
    imgs[270] = getNewImg(canvas.toDataURL());
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, height, width);

    return imgs;
};

/**
 * 深遍历一个对象
 * 携带prototype
 */
export const clone = source => {
    if (Object.prototype.toString.call(source) !== '[object Object]') {
        throw new Error('参数必须为对象');
    }

    const cloneObject = deepClone(source);
    Object.setPrototypeOf(cloneObject, Object.getPrototypeOf(source));
    return cloneObject;
};

/**
 * 深度复制
 */
export const deepClone = source => {
    // source如果是数组
    if (source instanceof Array) {
        return source.map(s => {
            return deepClone(s);
        });
    }

    // source如果是对象
    if (Object.prototype.toString.call(source) === '[object Object]') {
        const temp = {};
        Object.keys(source).forEach(key => {
            temp[key] = deepClone(source[key]);
        });
        return temp;
    }

    // source是一个普通的值
    return source;
};

/**
 * 对象的状态存储器
 * 保存对象的当前状态
 * 提供恢复状态方法
 */
export type ObjectStoreType<T> = () => T;
export const objectStore = <T extends Record<string, any>>(obj: T, keys?: string[]): ObjectStoreType<T> => {
    let state: Record<string, any> = {};
    if (keys && keys instanceof Array) {
        keys.forEach(key => {
            if (obj.hasOwnProperty(key)) {
                state[key] = deepClone(obj[key]);
            }
        });
    } else {
        state = deepClone(obj);
    }

    return () => {
        Object.keys(state).forEach(key => {
            (obj as any)[key] = state[key];
        });
        return obj;
    };
};

/**
 * 方法连续调用管理
 * @prop { number } gap 最大间隔时间，在这个间隔内触发的方法为连续触发
 * @prop { Function } fn 执行函数
 * @prop { Function } onStart 第一次触发方法回调
 * @prop { Function } onRun 方法触发过程回调
 * @prop { Function } onEnd 方法触发结束回调
 */
export const manageFnExecStatus = <T extends (...args: any[]) => any>({
    fn,
    gap,
    onStart,
    onRun,
    onEnd,
}: {
    fn: T;
    gap?: number;
    onStart?: (...args: Parameters<T>) => void;
    onRun?: (...args: Parameters<T>) => void;
    onEnd?: () => void;
}) => {
    let isContinued = false;
    let key: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (isContinued === false) {
            isContinued = true;
            onStart && onStart(...args);
        } else {
            onRun && onRun(...args);
        }

        // 执行方法
        fn(...args);

        if (key) {
            clearTimeout(key);
        }

        key = setTimeout(() => {
            isContinued = false;
            onEnd && onEnd();
        }, gap || 200);
    };
};

/**
 * 节流方法调用器
 */
export const throttleRun = (delay: number) => {
    let key: NodeJS.Timeout | null = null;
    return (fn: Function) => {
        if (key) {
            clearTimeout(key);
        }
        key = setTimeout(() => {
            fn();
            key = null;
        }, delay);
    };
};

export const toast = (dom: HTMLElement | null, time: number) => {
    if (!dom) {
        throw new Error('挂载的dom元素不存在');
    }
    let el: HTMLElement | null = document.createElement('div');
    el.style.width = '120px';
    el.style.height = '59px';
    el.style.background = 'rgba(0,0,0,0.5)';
    el.style.borderRadius = '10px';
    el.style.position = 'absolute';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.display = 'none';
    el.style.zIndex = '100';
    el.style.color = 'rgba(255,255,255,1)';
    el.style.fontSize = '24px';
    el.style.lineHeight = '59px';
    el.style.textAlign = 'center';
    dom.appendChild(el);

    let key: NodeJS.Timeout | null = null;

    return {
        show: (msg: string) => {
            if (!el) {
                return;
            }
            el.innerHTML = msg;
            el.style.display = 'block';
            key && clearTimeout(key);
            key = setTimeout(() => {
                if (!el) {
                    return;
                }
                el.style.display = 'none';
            }, time);
        },
        release: () => {
            if (el) {
                dom.removeChild(el);
                el = null;
            }
        },
    };
};
