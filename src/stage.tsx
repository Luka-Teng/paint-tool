import React from 'react';
import { Loading } from './components/loading';
import { PreLoad } from './components/pre-load';
import { Sprite, TextSprite, GraffitiSprite } from './sprite/index';
import { UpperDrawer } from './components/upper-drawer';
import { ImageDrawer } from './components/image-drawer';
import Tools from './components/tools/index';
import GrafftiStyleModal from './components/graffitiStyleModal/index';
import Cut, { CutReturnType } from './components/cut/index';
import {
    DragIcon,
    IPosition,
    SpriteType,
    ISpriteData,
    ITextOptions,
    IRectOptions,
    TypeImageInfo,
    IActiveOptions,
    IColor,
    IGraffitiSpriteOptions,
    IStageData,
} from './types';
import { CURSOR, normalizeAction, ICON, GraffitiSpriteOptions } from './config';
import {
    checkStrReg,
    getPlatform,
    preLoadImages,
    getEventPoint,
    trimDeg,
    getRotateImages,
    objectStore,
    ObjectStoreType,
    manageFnExecStatus,
    deepClone,
} from './utils';
import Axis from './axis';
import History from './history/index';
import definition from './history/definition';
import { Definition } from './history/types';

/* eslint-disable @typescript-eslint/camelcase,camelcase */

export interface ICorrectToolProps {
    imgUrl: string; // 图片地址
    width: number; // 图片宽度
    height: number; // 图片高度
    onChange: (list: ISpriteData) => void; // 变化回调
    actionName: SpriteType | string; // 当前动作
    disabled?: boolean; // 禁用标志
    annotate?: string[]; // 标注可选列表
    initData?: ISpriteData & IStageData; // 初始化标记
    patchImgs?: { name: string; url: string }[]; // 自定义贴纸
    inputStyle?: React.CSSProperties; // 文本输入框样式
    placeholder?: string; // 输入框 placeholder
    textOptions?: ITextOptions; // 文本配置
    rectOptions?: IRectOptions; // 框选配置
    graffitiOptions?: IGraffitiSpriteOptions; // 涂鸦配置
    crossOrigin?: '' | 'anonymous' | 'use-credentials'; // 图片跨域设置
    textMaxLength?: number; // 评语最大字数标记
    activeOptions?: IActiveOptions; // 精灵被选中时样式
    textEditStyle?: {
        fontSize?: { key: string; size: number }[];
        colors?: { red: number; green: number; blue: number; alpha: number }[];
    };
    backgroundColors?: IColor[];

    // toolbar相关属性
    toolbarDisabled?: boolean; // 是否显示toolbar
    onToolbarStatusChange?: (data: { type: string; status: 'active' | 'mute' }) => void; // toolbar上的状态改变
    toolbarExclude?: string[]; // 需要禁止的toolbar功能
    toolbarEventOverwrite?: {
        onRotateRight?: Function;
        onRotateLeft?: Function;
    }; // 需要取消的toolbar原声事件

    keyActionForHistory?: boolean; // 是否支持
}

interface ICorrectToolState {
    image: HTMLImageElement | null;
    imgUrl: string; // 当前展示图片地址
    actionKey: string; // template、patch_img时对应name
    actionName: SpriteType; // 当前动作
    inputValue: string; // 输入框内容
    canvasSize: TypeImageInfo; // canvas尺寸
    isImageLoad: boolean; // 是否图片已全部加载
    showInputModal: boolean; // 是否显示输入框
    isImageLoadFail: boolean; // 是否有图片加载失败
    isTextSizeSelectShow: boolean;
    isTextStyleModalShow: boolean; // 是否显示文字样式编辑框
    isCutShow: boolean; // 是否展示裁剪
    isGraffitiStyleModalShow: boolean; // 是否显示画笔框
    isGraffitiActive: boolean; // 是否涂鸦处于激活状态
    backgroundColor: IColor; // 背景颜色
    graffitiOption: IRectOptions; // 涂鸦配置
}

export default class Stage extends React.Component<ICorrectToolProps, ICorrectToolState> {
    constructor(props: ICorrectToolProps) {
        super(props);

        const { imgUrl, width, height, patchImgs = [], crossOrigin, graffitiOptions } = props;
        const { actionName, actionKey } = normalizeAction(props.actionName);

        this.id = Math.random()
            .toString(36)
            .slice(2);
        this.imageLoadingPromise = preLoadImages([imgUrl, ...patchImgs.map(p => p.url)], crossOrigin); // 加载批改图片

        this.state = {
            image: null,
            imgUrl,
            actionKey,
            actionName,
            inputValue: '',
            canvasSize: { width, height },
            isImageLoad: false, // 是否图片已全部加载
            showInputModal: false, // 是否显示输入框
            isImageLoadFail: false, // 是否有图片加载失败
            isTextSizeSelectShow: false,
            isTextStyleModalShow: false,
            isCutShow: false,
            isGraffitiStyleModalShow: false,
            isGraffitiActive: false,
            backgroundColor: {
                red: 255,
                green: 255,
                blue: 255,
                alpha: 1,
            },
            graffitiOption: (graffitiOptions && graffitiOptions.defaultOption) || GraffitiSpriteOptions.defaultOption,
        };

        this.history = new History(definition, this);
    }

    id: string; // 唯一id

    canMove: boolean; // 当前命中精灵是否可移动

    rectGrowing: DragIcon | false = false; // 当前命中精灵的缩放点

    lastInserted = 0; // 上一次有插入操作

    isInsert: boolean; // 用户插入动作标志

    insertTimer: number; // 插入动作清空延迟

    movingDrawer = false; // 正在移动的drawer

    currentSprite: Sprite | null = null; // 当前点击命中的精灵

    isRectDrawing: boolean; // 当前是否在画框标识

    isGraffitiDrawing: boolean; // 当前是否是在涂鸦

    lastMouseDownPosition: IPosition = { x: 0, y: 0 }; // 上一次点击的原始坐标

    isDoubleClickRange = false; // 当前是否为双击

    canvasSizeBeforeCut: TypeImageInfo; // 裁剪前的canvasSize

    rotateImages: {
        0: HTMLImageElement;
        90: HTMLImageElement;
        180: HTMLImageElement;
        270: HTMLImageElement;
    } | null; // 四个不同方向的图片

    rotateDeg = 0; // 旋转度数

    myInput: HTMLDivElement; // 文本框

    template: Record<string, HTMLImageElement> = {}; // 全部template icons

    patchImgs: Record<string, { url: string; img: HTMLImageElement }> = {}; // 全部patch_imgs

    upperDrawer: UpperDrawer; // 画图工具

    imageDrawer: ImageDrawer; // 原图

    canvasContainer: HTMLDivElement; // 画布容器

    imageLoadingPromise: Promise<HTMLImageElement[]>; // 预加载原图promise

    axis: Axis; // 坐标系

    history: History<typeof definition>; //历史记录

    hasCut = false; // 是否经过一次裁剪

    // 用于记录sprite移动的历史记录
    spriteBeforeChange: ObjectStoreType<Sprite> | null = null;

    // 用于记录画布移动的历史记录
    prevTranslateState: { x: number; y: number };

    // 修改涂鸦的全局配置
    public setGraffitiOptions = (options: IRectOptions) => {
        this.setState({
            graffitiOption: options,
        });
    };

    // 增加历史记录
    private addHistory = (stackItem: Parameters<History<Definition>['push']>[0], isChanged = false) => {
        this.history.push(stackItem);
        isChanged && this.callback();
    };

    // 创建sprite的对象存储器，用于暂存当前状态
    private spriteStore = (sprite: Sprite) => {
        // 只需要存储绘制关键性属性
        return objectStore(sprite, [
            'x',
            'y',
            'width',
            'height',
            'content',
            'options',
            'spriteFontSize',
            'displayArray',
            'points',
        ]);
    };

    // 返回一段操作前后的坐标系状态
    private getAxisStates = (fn: Function) => {
        const prev = {
            x: this.axis.spriteAxis.zeroX,
            y: this.axis.spriteAxis.zeroY,
            scale: this.axis.spriteAxis.scale,
        };
        fn();
        const next = {
            x: this.axis.spriteAxis.zeroX,
            y: this.axis.spriteAxis.zeroY,
            scale: this.axis.spriteAxis.scale,
        };
        return [prev, next];
    };

    // 记录一段过程内sprite变化的历史记录
    private recordSpriteChangeHistroty = (spriteOrKey: Sprite | string, fn: Function) => {
        let sprite: Sprite | undefined;
        if (typeof spriteOrKey === 'string') {
            sprite = this.upperDrawer.drawList.find(e => e.key === spriteOrKey);
        } else {
            sprite = spriteOrKey;
        }

        if (sprite) {
            const prev = this.spriteStore(sprite);
            fn();
            const next = this.spriteStore(sprite);
            this.addHistory({ type: 'spriteChange', payload: [prev, next] }, true);
        }
    };

    static getDerivedStateFromProps(props: ICorrectToolProps, state: ICorrectToolState) {
        const { actionName, actionKey } = normalizeAction(props.actionName);
        const nextState: Partial<ICorrectToolState> = {};

        if (actionName !== state.actionName || (actionName === state.actionName && actionKey !== state.actionKey)) {
            nextState.actionKey = actionKey;
            nextState.actionName = actionName;
            nextState.showInputModal = false;
        }

        // 涂鸦工具
        if (state.isGraffitiActive) {
            nextState.actionName = 'graffiti';
        }

        return nextState;
    }

    // 用于滚动产生的scale的历史记录记录
    private scaleWithHistory = (() => {
        let prevState: { x: number; y: number; scale: number } | null = null;
        let nextState: { x: number; y: number; scale: number } | null = null;
        return manageFnExecStatus({
            gap: 200,
            fn: (point: IPosition, scale: number) => {
                this.axis.scaleSprite(point, scale);
            },
            onStart: () => {
                const { zeroX: x, zeroY: y, scale } = this.axis.spriteAxis;
                prevState = { x, y, scale };
            },
            onEnd: () => {
                const { zeroX: x, zeroY: y, scale } = this.axis.spriteAxis;
                nextState = { x, y, scale };
                if (prevState && nextState && (prevState.x !== x || prevState.y !== y || prevState.scale !== scale)) {
                    this.history.push({ type: 'scale', payload: [prevState, nextState] });
                }
            },
        });
    })();

    // 插入操作
    public insert = (insertAction: string) => {
        if (this.props.disabled || !this.state.isImageLoad) {
            return;
        }

        const { actionName, actionKey } = normalizeAction(insertAction);
        const { width, height } = this.state.canvasSize;
        let middleX = width / 2 + this.lastInserted * 20;
        let middleY = height / 2 + this.lastInserted * 20;
        let el: Sprite | undefined;

        if (middleX + ICON.width / 2 > width) {
            middleX = width - ICON.width / 2;
        }
        if (middleY + ICON.height / 2 > height) {
            middleY = height - ICON.height / 2;
        }

        this.currentSprite = null;
        this.lastInserted++;
        this.isInsert = true;
        this.insertTimer && clearTimeout(this.insertTimer);
        this.insertTimer = window.setTimeout(() => {
            this.isInsert = false;
        }, 100);

        if (this.state.showInputModal) {
            // 如果当前已经有有输入框打开了，则关闭插入
            this.closeInputModal();

            if (!this.state.inputValue.match(checkStrReg)) {
                this.lastInserted++; // 用户insert方法插入需要 + 1
                this.handleTextSprite('create');
                setTimeout(() => {
                    // setState不是同步执行，防止死循环
                    this.insert('text');
                }, 0);
                return;
            }
        }

        if (actionName === 'text') {
            this.lastInserted && this.lastInserted--;
            this.lastMouseDownPosition = { x: middleX, y: middleY };
            this.openInputModal(this.lastMouseDownPosition);
        }

        if (actionName === 'template') {
            el = this.upperDrawer.createTemplateSprite(actionKey, this.template[actionKey], {
                x: middleX,
                y: middleY,
            });
        }

        if (actionName === 'patch_img' && this.patchImgs) {
            const patchImg = this.patchImgs[actionKey];
            el = this.upperDrawer.createImgSprite(actionKey, patchImg.img, patchImg.url, {
                x: middleX,
                y: middleY,
            });
        }

        if (actionName === 'rectangle') {
            el = this.upperDrawer.createRectSprite(
                {
                    x: middleX - ICON.width / 2,
                    y: middleY - ICON.height / 2,
                    width: ICON.width,
                    height: ICON.height,
                },
                this.props.rectOptions
            );
        }

        if (el) {
            this.addHistory({ type: 'spriteAdd', payload: [this.spriteStore(el)] }, true);
            this.currentSprite = Object.assign({}, el);
            this.upperDrawer.paint(el);
        }
    };

    /**
     * 清除，用户行为的清除
     */
    public clear = (clearAction?: string[]) => {
        const actionNames: SpriteType[] = [];
        const actionKeys: string[] = [];

        clearAction &&
            clearAction.forEach(action => {
                const { actionName, actionKey } = normalizeAction(action);
                !actionNames.includes(actionName) && actionNames.push(actionName);
                !actionKeys.includes(actionKey) && actionKeys.push(actionKey);
            });

        // 关闭graffiti modal
        if (this.state.isGraffitiStyleModalShow) {
            this.closeGraffitiStyleModal();
        }

        if (this.upperDrawer.drawList.length > 0) {
            this.lastInserted = 0;
            this.addHistory({ type: 'clear', payload: [[...this.upperDrawer.drawList]] });
            this.upperDrawer.clear(actionNames, actionKeys);
            this.callback();

            // 如果currentSprite被删除，置空
            if (
                this.currentSprite &&
                this.upperDrawer.drawList.filter(s => s.key === (this.currentSprite as Sprite).key).length < 0
            ) {
                this.currentSprite = null;
            }
        }
    };

    // 清除所有的sprite
    private clearSprites = () => {
        // 关闭graffiti modal
        if (this.state.isGraffitiStyleModalShow) {
            this.closeGraffitiStyleModal();
        }
        this.lastInserted = 0;
        this.currentSprite = null;
        this.upperDrawer.drawList = [];
    };

    // 用户主动获取数据
    public submit = () => {
        const defaultConfig: Record<string, any> = {
            img_url: this.props.imgUrl,
            bg_src_ops: [],
        };

        if (this.rotateDeg !== 0) {
            defaultConfig.bg_src_ops.push({
                bg_src_rotate: {
                    angle: -this.rotateDeg,
                },
            });
        }

        // 计算裁剪信息
        const { zeroX, zeroY } = this.axis.originAxis;
        const { canvasSize, lengthSprite2Origin, pointSprite2Origin } = this.axis;
        const { x, y } = pointSprite2Origin({ x: zeroX, y: zeroY });
        const { backgroundColor } = this.state;
        defaultConfig.bg_src_ops.push({
            bg_canvas: {
                bg_size: {
                    width: Math.ceil(lengthSprite2Origin(canvasSize.width, 'x')),
                    height: Math.ceil(lengthSprite2Origin(canvasSize.height, 'y')),
                },
                start_pos: {
                    x: Math.floor(x),
                    y: Math.floor(y),
                },
                bg_color: {
                    ...backgroundColor,
                    alpha: Math.round(backgroundColor.alpha * 255),
                },
            },
        });
        return Object.assign(this.upperDrawer.output(), defaultConfig);
    };

    // 回调数据给宿主环境
    public callback = () => {
        this.props.onChange(this.submit());
    };

    // 数据初始化
    private initStageData = (data: any) => {
        /**
         * 旋转和裁剪的初始化
         * 旋转裁剪只会存在一次数据
         * 目前的设计存在一定缺，整个视口并不是定宽和定高，所以能做标准只有
         * 1. 水平状态下宽度不变
         * 2. 垂直状态下高度不变
         */
        if (data.bg_src_ops) {
            data.bg_src_ops.forEach(option => {
                // 旋转初始化
                if (option.bg_src_rotate) {
                    this.rotate(-option.bg_src_rotate.angle, true);
                }

                // 裁剪初始化
                if (option.bg_canvas) {
                    const { bg_size, start_pos = { x: 0, p: 0 }, bg_color } = option.bg_canvas;
                    const { width: canvasWidth, height: canvasHeight } = this.axis.canvasSize;
                    const { x: ratioX, y: ratioY } = this.axis.ratio;

                    let scale = 1;
                    let currentCanvasSize = this.axis.canvasSize;

                    if (this.rotateDeg === 90 || this.rotateDeg === 270) {
                        scale = canvasHeight / (bg_size.height * ratioY);
                        currentCanvasSize = {
                            height: canvasHeight,
                            width: scale * (bg_size.width * ratioX),
                        };
                    } else {
                        scale = canvasWidth / (bg_size.width * ratioX);
                        currentCanvasSize = {
                            width: canvasWidth,
                            height: scale * (bg_size.height * ratioY),
                        };
                    }

                    const originPoint = {
                        x: start_pos.x * scale * ratioX,
                        y: start_pos.y * scale * ratioY,
                    };
                    this.axis.updateCanvasSize(currentCanvasSize);
                    this.axis.changeOrigin(originPoint, scale);

                    if (bg_color) {
                        bg_color.alpha /= 255;
                        this.setState({
                            canvasSize: currentCanvasSize,
                            backgroundColor: bg_color,
                        });
                    } else {
                        this.setState({
                            canvasSize: currentCanvasSize,
                        });
                    }
                }
            });
        }
    };

    // 画布初始化
    private initStage = (isRetry = false) => {
        if (isRetry) {
            const { imgUrl, patchImgs = [], crossOrigin } = this.props;
            this.imageLoadingPromise = preLoadImages([imgUrl, ...patchImgs.map(p => p.url)], crossOrigin); // 加载批改图片
        }

        this.imageLoadingPromise
            .then(imgs => {
                // 第一张图片是底图，后面的是自定义图片
                if (imgs.length > 1) {
                    const { patchImgs = [] } = this.props;
                    for (let i = 1, len = imgs.length; i < len; i++) {
                        const { name, url } = patchImgs[i - 1];
                        this.patchImgs[name] = { url, img: imgs[i] };
                    }
                }
                // 坐标系在原图加载完后在更新
                this.axis = new Axis(this.state.canvasSize, {
                    width: imgs[0].width,
                    height: imgs[0].height,
                });
                this.rotateImages = getRotateImages(imgs[0]);
                this.setState({ isImageLoad: true, image: imgs[0] }, () => {
                    const { initData } = this.props;
                    // 警告：如果有初始化数据，直接覆盖drawList
                    if (initData && this.upperDrawer) {
                        // isImageLoad虽然rerender，但是canvas的ctx并没有立刻能用，但是也没有报错
                        setTimeout(() => {
                            const _initData = deepClone(initData);
                            this.initStageData(_initData);
                            this.upperDrawer.data2Sprite(_initData, this.template, this.patchImgs);
                            this.upperDrawer.paint();
                        }, 0);
                    }
                });
            })
            .catch(() => {
                this.setState({
                    isImageLoad: false,
                    isImageLoadFail: true,
                });
            });
    };

    // 画布容器
    private getCanvasContainer = (container: HTMLDivElement) => {
        if (container) {
            this.canvasContainer = container;
            container.addEventListener('wheel', this.handleWheel, { passive: false });
        }
    };

    // 文本精灵处理
    private handleTextSprite = (mode: 'create' | 'update') => {
        const { upperDrawer, currentSprite, lastMouseDownPosition } = this;
        const { inputValue } = this.state;
        if (mode === 'create') {
            const el = upperDrawer.createTextSprite(inputValue, lastMouseDownPosition, this.props.textOptions);
            this.addHistory({ type: 'spriteAdd', payload: [this.spriteStore(el)] }, true);
        } else if (currentSprite) {
            this.recordSpriteChangeHistroty(currentSprite.key, () => {
                this.upperDrawer.changeTextValue(currentSprite.key, inputValue);
            });
        }
    };

    // 关闭输入框
    private closeInputModal = () => {
        this.setState({
            showInputModal: false,
            isTextStyleModalShow: false,
            isTextSizeSelectShow: false,
        });
    };

    // 关闭文本样式弹出框
    private closeTextStyleModal = () => {
        if (this.state.isTextSizeSelectShow || this.state.isTextStyleModalShow) {
            this.setState({
                isTextStyleModalShow: false,
                isTextSizeSelectShow: false,
            });
        }
    };

    // 打开文本输入框
    private openInputModal = (pos: IPosition) => {
        // 神奇的Safari/旧版本Chrome69以前，当mousedown事件触发时，下面突然出现一个输入框，冒泡终止, mouseup事件不执行
        // 解决方案1，加延迟
        // 解决方案2，输入框不要放在鼠标下面
        this.setState({ showInputModal: true, inputValue: '' }, () => {
            // 如果输入框放不下，左移动
            this.myInput.style.left = `${pos.x}px`;
            this.myInput.style.top = `${pos.y}px`;
            const focusTimer = setTimeout(() => {
                (this.myInput.children[0] as HTMLInputElement).focus();
                window.clearTimeout(focusTimer);
            }, 0);
        });
    };

    /********************************* 事件相关 *********************************/

    // 点击模版绘制文本批注
    private handleClickInput = (value: string) => {
        this.setState(
            {
                inputValue: value,
            },
            () => {
                this.handleTextSprite(this.currentSprite ? 'update' : 'create');
            }
        );
        // 考虑用户insert插入情况
        if (this.lastInserted) {
            this.lastInserted++;
        } else {
            this.lastInserted += 2;
        }
        this.closeInputModal();
    };

    // 键盘删除快捷键（DEL）
    private handleKeyboard = (event: KeyboardEvent) => {
        const code = event.keyCode || event.charCode;
        const { keyActionForHistory = false } = this.props;

        if (this.state.showInputModal) {
            return;
        }

        // ctrl + z
        if (keyActionForHistory && event.ctrlKey && code === 90) {
            this.back();
        }

        // ctrl + y
        if (keyActionForHistory && event.ctrlKey && code === 89) {
            this.forward();
        }

        // 删除
        if (code === 8 || code === 46) {
            const { upperDrawer } = this;

            // 关闭graffiti modal
            if (this.state.isGraffitiStyleModalShow) {
                this.closeGraffitiStyleModal();
            }

            this.closeTextStyleModal();
            if (this.currentSprite) {
                upperDrawer.removeSprite(this.currentSprite);
                this.addHistory({ type: 'spriteRemove', payload: [this.currentSprite] }, true);
                upperDrawer.paint();
                this.currentSprite = null;
            }
        }
    };

    // 输入框事件
    private handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const inputValue = event.target.value;
        this.setState({ inputValue });

        const child = this.myInput.children[0] as HTMLTextAreaElement;
        child.style.height = 'auto';
        child.scrollTop = 0;
        const height = child.scrollHeight + (inputValue.split('\n').length > 2 && inputValue.endsWith('\n') ? 30 : 0);
        child.style.height = `${height}px`;
    };

    // 键盘回车键输入批注
    private handleKeyboardInput = (event: React.KeyboardEvent<HTMLDivElement>) => {
        event.stopPropagation();
        const code = event.keyCode || event.charCode;
        if (code === 13) {
            // 回车键
            event.preventDefault();
            const { inputValue } = this.state;
            const platform = getPlatform();
            if ((platform === 'mac' && event.metaKey) || (platform === 'win' && event.ctrlKey)) {
                // 换行
                this.handleInputChange({
                    target: {
                        value: `${inputValue}\n`,
                    },
                } as React.ChangeEvent<HTMLTextAreaElement>);
                return;
            }
            if (!inputValue.match(checkStrReg)) {
                this.handleTextSprite(this.currentSprite ? 'update' : 'create');
                this.upperDrawer.paint();
                this.closeInputModal();
            }
        } else if (code === 27) {
            // ESC键
            this.closeInputModal();
        }
    };

    // 清空选中
    private handleFocus = (event: MouseEvent) => {
        // 点击事件用来关闭选中精灵、保存文本
        const { className, dataset, tagName } = event.target as HTMLElement;
        if (this.isInsert) {
            return;
        }

        // 隐藏输入框
        if ((dataset.handleKey && this.id !== dataset.handleKey) || !dataset.handleKey) {
            // 关闭graffiti modal
            if (this.state.isGraffitiStyleModalShow) {
                this.closeGraffitiStyleModal();
            }

            // 如果输入框显示状态
            if (this.state.showInputModal && tagName.toLocaleLowerCase() !== 'textarea') {
                // 如有内容，则新建
                if (!this.state.inputValue.match(checkStrReg)) {
                    this.handleTextSprite(
                        this.currentSprite && this.currentSprite.type === 'text' ? 'update' : 'create'
                    );
                    this.upperDrawer.paint();
                } else if (this.currentSprite) {
                    this.upperDrawer.removeSprite(this.currentSprite);
                    this.addHistory({ type: 'spriteRemove', payload: [this.currentSprite] }, true);
                    this.upperDrawer.paint();
                }
                this.closeInputModal();
                return;
            }
        }
        if (
            (className === 'upper-canvas' && this.id !== dataset.handleKey) ||
            (className !== 'upper-canvas' && !this.state.showInputModal)
        ) {
            // 点击画布以外的地方
            this.currentSprite = null;
            this.upperDrawer && this.upperDrawer.paint();
        }
    };

    // 滚动缩放
    private handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.lastInserted = 0;
        const { eventX, eventY } = getEventPoint(event as any, this.imageDrawer.canvas);

        // sprite层坐标进行scale改变
        this.scaleWithHistory({ x: eventX, y: eventY }, event.deltaY > 0 ? 1.1 : 1 / 1.1);

        // 统一绘制
        this.imageDrawer.paint();
        this.upperDrawer.paint();
    };

    // 鼠标按下事件
    private handleMousedown = (event: React.MouseEvent<HTMLDivElement>) => {
        const { isImageLoad, showInputModal, inputValue, actionName, actionKey } = this.state;

        // 事件不可用，非鼠标左键 || 禁用 || 图片加载中（包括异常）
        if (event.button !== 0 || this.props.disabled || !isImageLoad) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        this.lastInserted = 0;
        const { eventX, eventY } = getEventPoint(event, this.imageDrawer.canvas);
        const currentMouseDownPosition = { x: eventX, y: eventY };

        const { upperDrawer } = this;
        const hitSprite = upperDrawer.isHit(currentMouseDownPosition.x, currentMouseDownPosition.y);

        // 关闭graffiti modal
        if (this.state.isGraffitiStyleModalShow) {
            this.closeGraffitiStyleModal();
        }

        // 创建文本框、已打开文本绘画
        if (showInputModal) {
            // 输入框存在的情况下，不存储新的位置
            if (!inputValue.match(checkStrReg)) {
                this.handleTextSprite(this.currentSprite ? 'update' : 'create');
                upperDrawer.paint();
            } else if (this.currentSprite) {
                upperDrawer.removeSprite(this.currentSprite);
                this.addHistory({ type: 'spriteRemove', payload: [this.currentSprite] }, true);
                upperDrawer.paint();
            }
            this.closeInputModal();
        } else if (hitSprite && !this.state.isGraffitiActive) {
            // 有命中精灵
            let isDoubleClick = false;
            if (
                this.isDoubleClickRange &&
                this.currentSprite &&
                this.currentSprite.key === hitSprite.key &&
                this.currentSprite.type === 'text'
            ) {
                // 双击文本框
                isDoubleClick = true;
                this.setState({
                    showInputModal: true,
                    inputValue: (hitSprite.textArray as string[]).join('\n'),
                });
                this.closeTextStyleModal();
                const { x, y } = this.currentSprite.canvasPosition();
                this.myInput.style.left = `${x}px`;
                this.myInput.style.top = `${y}px`;
                this.isDoubleClickRange = false;
                upperDrawer.setCache(hitSprite);
                const focusTimer = setTimeout(() => {
                    (this.myInput.children[0] as HTMLInputElement).focus();
                    window.clearTimeout(focusTimer);
                }, 0);
            }
            this.currentSprite = hitSprite;
            this.rectGrowing =
                hitSprite.canResize && hitSprite.isHitGrow(currentMouseDownPosition.x, currentMouseDownPosition.y);
            this.canMove = !this.rectGrowing;

            upperDrawer.setCache(this.currentSprite);
            upperDrawer.paint(this.currentSprite);

            if (this.currentSprite.type === 'text') {
                this.isDoubleClickRange = true;
                setTimeout(() => {
                    this.isDoubleClickRange = false;
                }, 240);
                if (!isDoubleClick) {
                    this.setState({
                        isTextStyleModalShow: true,
                        isTextSizeSelectShow: false,
                    });
                }
            }

            if (this.currentSprite.type === 'graffiti') {
                // 打开graffiti modal
                this.openGraffitiStyleModal();
            }
        } else {
            this.currentSprite = null;
            let historyEl: Sprite | null = null;
            this.closeTextStyleModal();

            if (actionName === 'template' && this.template[actionKey]) {
                const image = this.template[actionKey];
                historyEl = upperDrawer.createTemplateSprite(actionKey, image, currentMouseDownPosition);
            } else if (actionName === 'patch_img' && this.patchImgs[actionKey]) {
                const image = this.patchImgs[actionKey];
                historyEl = upperDrawer.createImgSprite(actionKey, image.img, image.url, currentMouseDownPosition);
            } else if (actionName === 'text') {
                this.openInputModal(currentMouseDownPosition);
            } else if (actionName === 'rectangle') {
                const el = this.upperDrawer.createRectSprite(currentMouseDownPosition, this.props.rectOptions);
                this.isRectDrawing = true;
                this.currentSprite = el;
            } else if (actionName === 'graffiti') {
                const el = this.upperDrawer.createGraffitiSprite([currentMouseDownPosition], {
                    ...this.state.graffitiOption,
                });
                this.isGraffitiDrawing = true;
                this.currentSprite = el;
            } else {
                this.movingDrawer = true;
                this.prevTranslateState = {
                    x: this.axis.spriteAxis.zeroX,
                    y: this.axis.spriteAxis.zeroY,
                };
            }

            if (historyEl) {
                this.addHistory({ type: 'spriteAdd', payload: [this.spriteStore(historyEl)] }, true);
            }
        }

        this.lastMouseDownPosition = currentMouseDownPosition;
    };

    // 鼠标move事件监听
    private handleMousemove = (event: React.MouseEvent<HTMLDivElement>) => {
        // 事件不可用
        if (this.props.disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const { upperDrawer, currentSprite } = this;
        const { translateSprite } = this.axis;
        const { eventX, eventY } = getEventPoint(event, this.imageDrawer.canvas);
        const { movementX, movementY } = event;

        const hitSprite = upperDrawer.isHit(eventX, eventY);

        if (hitSprite) {
            if (hitSprite.canResize) {
                const growDirection = hitSprite.isHitGrow(eventX, eventY);
                upperDrawer.canvas.style.cursor = growDirection ? CURSOR[growDirection] : CURSOR['move'];
            } else {
                upperDrawer.canvas.style.cursor = CURSOR['move'];
            }
        } else {
            upperDrawer.canvas.style.cursor = CURSOR['default'];
        }

        if (this.isRectDrawing && currentSprite) {
            const { type } = currentSprite;
            if (type === 'rectangle') {
                this.spriteBeforeChange = this.spriteBeforeChange || this.spriteStore(currentSprite);
                currentSprite.init(eventX, eventY, this.lastMouseDownPosition);
                this.upperDrawer.paintFromCache(currentSprite);
            }
        } else if (this.isGraffitiDrawing && currentSprite) {
            const { type } = currentSprite;
            if (type === 'graffiti') {
                this.spriteBeforeChange = this.spriteBeforeChange || this.spriteStore(currentSprite);
                currentSprite.init(eventX, eventY);
                this.upperDrawer.paintFromCache(currentSprite);
            }
        } else if (this.rectGrowing && currentSprite) {
            upperDrawer.canvas.style.cursor = CURSOR[this.rectGrowing];
            if (!currentSprite.canResize) {
                return;
            }
            this.spriteBeforeChange = this.spriteBeforeChange || this.spriteStore(currentSprite);
            currentSprite.drag(this.rectGrowing, movementX, movementY);
            this.upperDrawer.paintFromCache(currentSprite);
        } else if (this.canMove && currentSprite) {
            this.spriteBeforeChange = this.spriteBeforeChange || this.spriteStore(currentSprite);
            this.closeTextStyleModal();

            // graffiti在移动时，modal也跟随
            if (currentSprite.type === 'graffiti') {
                this.openGraffitiStyleModal();
            }

            currentSprite.move(movementX, movementY);
            upperDrawer.paintFromCache(currentSprite);
        } else if (this.movingDrawer && this.axis.spriteAxis.scale > 1) {
            translateSprite(movementX, movementY);
            this.imageDrawer.paint();
            this.upperDrawer.paint();
        }

        // grattiffi激活状态，鼠标显示pen
        if (this.state.isGraffitiActive) {
            this.upperDrawer.canvas.style.cursor = CURSOR['pen'];
        }
    };

    // 鼠标up事件监听
    private handleMouseEnd = (event: React.MouseEvent<HTMLDivElement>) => {
        // 事件不可用，非鼠标左键
        if (event.button !== 0) {
            return;
        }

        if (this.currentSprite && this.currentSprite.type === 'rectangle' && this.isRectDrawing) {
            this.addHistory({ type: 'spriteAdd', payload: [this.spriteStore(this.currentSprite)] }, true);
            this.currentSprite = null;
            this.isRectDrawing = false;
        }

        if (this.currentSprite && this.currentSprite.type === 'graffiti' && this.isGraffitiDrawing) {
            if (!this.currentSprite.isValid()) {
                this.upperDrawer.removeSprite(this.currentSprite);
            } else {
                this.addHistory({ type: 'spriteAdd', payload: [this.spriteStore(this.currentSprite)] }, true);
            }
            this.currentSprite = null;
            this.isGraffitiDrawing = false;
        }

        // 拉伸情况
        if (this.currentSprite && this.rectGrowing && this.spriteBeforeChange) {
            this.addHistory(
                { type: 'spriteChange', payload: [this.spriteBeforeChange, this.spriteStore(this.currentSprite)] },
                true
            );
        }
        this.rectGrowing = false;

        // 移动情况
        if (this.currentSprite && this.canMove && this.spriteBeforeChange) {
            this.addHistory(
                { type: 'spriteChange', payload: [this.spriteBeforeChange, this.spriteStore(this.currentSprite)] },
                true
            );
        }
        this.canMove = false;

        if (this.movingDrawer) {
            this.movingDrawer = false;
            const nextTranslateState = {
                x: this.axis.spriteAxis.zeroX,
                y: this.axis.spriteAxis.zeroY,
            };
            if (
                nextTranslateState.x !== this.prevTranslateState.x ||
                nextTranslateState.y !== this.prevTranslateState.y
            ) {
                this.addHistory({ type: 'translate', payload: [this.prevTranslateState, nextTranslateState] });
            }
        }

        this.spriteBeforeChange = null;
        this.upperDrawer.cache = undefined;

        // grattiffi激活状态，鼠标显示pen
        if (this.state.isGraffitiActive) {
            this.upperDrawer.canvas.style.cursor = CURSOR['pen'];
        } else {
            this.upperDrawer.canvas.style.cursor = CURSOR['default'];
        }

        this.upperDrawer.paint(this.currentSprite as any);
    };

    /********************************* 生命周期 & 渲染 *********************************/

    componentDidMount() {
        this.initStage();
        document.addEventListener('keydown', this.handleKeyboard);
        document.addEventListener('click', this.handleFocus);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyboard);
        document.removeEventListener('click', this.handleFocus);
    }

    // 文字样式编辑
    private renderTextStyle() {
        const { textEditStyle } = this.props;
        const { isTextStyleModalShow, isTextSizeSelectShow } = this.state;
        if (!this.currentSprite) {
            return null;
        }

        const { type } = this.currentSprite;

        if (!isTextStyleModalShow || !textEditStyle || type !== 'text') {
            return null;
        }

        const { x, y, height } = this.currentSprite.canvasPosition();
        const { options, key } = this.currentSprite as TextSprite;
        const { fontSize = [], colors } = textEditStyle;
        const res = fontSize.find(f => f.size === options.font_size);

        const selectTextStyle = (style: Record<string, any>) => {
            this.closeTextStyleModal();
            this.recordSpriteChangeHistroty(key, () => {
                this.upperDrawer.changeTextStyle(key, style);
            });
        };

        return (
            <div
                className="component-draw-tool-text-style-popup"
                style={{ top: `${y + height + 5}px`, left: `${x}px` }}
            >
                {fontSize ? (
                    <div className="component-draw-tool-text-style-popup-font-box">
                        <div onClick={() => this.setState({ isTextSizeSelectShow: true })}>
                            {res ? res.key : options.font_size}
                        </div>
                        <div style={{ display: isTextSizeSelectShow ? 'block' : 'none' }}>
                            {fontSize.map(font => (
                                <div
                                    key={font.size}
                                    className="component-draw-tool-text-style-popup-font-item"
                                    onClick={() => selectTextStyle({ fontSize: font.size })}
                                >
                                    {font.key}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
                {colors
                    ? colors.map(color => (
                          <div
                              className="component-draw-tool-text-style-color"
                              key={`${color.red},${color.green},${color.blue}`}
                              style={{
                                  backgroundColor: `rgba(${color.red},${color.green},${color.blue},${color.alpha})`,
                              }}
                              onClick={() => selectTextStyle({ color })}
                          />
                      ))
                    : null}
            </div>
        );
    }

    // 批注搜索
    private renderAnnotate() {
        const { annotate = [] } = this.props;
        const { inputValue } = this.state;

        if (annotate.length === 0) {
            return null;
        }

        const annotateNode: React.ReactElement[] = [];
        const inputValueLen = inputValue.length;

        for (let i = 0, len = annotate.length; i < len; i++) {
            const item = annotate[i];
            const index = item.indexOf(inputValue);

            if (inputValue === '' || index >= 0) {
                const bw = `${item.slice(0, index)}`;
                const rw = <span>{item.slice(index, index + inputValueLen)}</span>;
                const aw = `${item.slice(index + inputValueLen, item.length)}`;

                annotateNode.push(
                    <li title={item.length > 9 ? item : undefined} key={i} onClick={() => this.handleClickInput(item)}>
                        {bw}
                        {rw}
                        {aw}
                    </li>
                );
            }
        }

        return annotateNode.length !== 0 ? <ul>{annotateNode}</ul> : null;
    }

    /*** 裁剪相关方法 ***/

    // 裁剪结束回调
    private onCutFinish = (options: CutReturnType) => {
        if (this.props.disabled || !this.state.image || !this.rotateImages) {
            this.setState({ isCutShow: false });
            return;
        }

        const { originScale, originY, originX, currentCanvasSize, backgroundColor } = options;

        // 清空sprite
        this.clearSprites();
        const image = this.rotateImages[0];

        // 缩放恢复
        this.axis.scaleSprite({ x: 0, y: 0 }, 0);

        // 恢复旋转
        this.restoreRotate();

        // 坐标系变化
        this.axis.cut(currentCanvasSize, { x: originX, y: originY }, originScale);

        this.setState(
            {
                canvasSize: currentCanvasSize,
                isCutShow: false,
                backgroundColor,
                image,
            },
            () => {
                this.imageDrawer.paint();
            }
        );

        // 清空历史记录
        this.history.clear();
        this.callback();
        this.hasCut = true;
    };

    /**
     * 打开裁剪
     */
    public openCutMode = () => {
        if (this.props.disabled || !this.state.image || !this.rotateImages) {
            return;
        }

        this.canvasSizeBeforeCut = this.state.canvasSize;
        const { width, height } = this.props;
        this.setState({
            isCutShow: true,
            canvasSize: { width, height },
        });
    };

    // 关闭裁剪
    public closeCutMode = () => {
        this.setState({
            canvasSize: this.canvasSizeBeforeCut,
            isCutShow: false,
        });
    };

    /*** 旋转相关方法 ***/

    /**
     * 旋转
     * 改变量
     * 1. axis中的原图坐标系的originX，originY
     * 2. canvasSize中width，height互换
     * 3. 旋转度数，360进制
     * 4. 目前只支持90，180，270四种旋转模式
     */
    public rotate = (deg, isHistory = false) => {
        if (this.props.disabled || !this.state.image || !this.rotateImages) {
            return;
        }

        deg = trimDeg(deg);

        if (deg !== 90 && deg !== 180 && deg !== 270) {
            return;
        }

        const [prevScaleState, nextScaleState] = this.getAxisStates(() => {
            this.axis.rotate(deg);
        });

        this.rotateDeg = trimDeg(deg + this.rotateDeg);
        const rotateImg = this.rotateImages[this.rotateDeg];

        this.setState(
            {
                canvasSize: this.axis.canvasSize,
                image: rotateImg,
            },
            () => {
                this.imageDrawer.paint();
            }
        );

        /**
         * rotate方法会被人为调用或者历史记录调用
         * 1. 人为调用，需要清空sprite，并记录历史记录
         * 2. 历史记录调用， 不需要清空sprite，也不需要记录历史记录
         */
        if (!isHistory) {
            this.addHistory([
                { type: 'clear', payload: [[...this.upperDrawer.drawList]] },
                { type: 'rotate', payload: [deg] },
                { type: 'scale', payload: [prevScaleState, nextScaleState] },
            ]);

            // 清空sprite
            this.clearSprites();
            this.callback();
        }
    };

    // 旋转恢复到原始状态
    public restoreRotate = () => {
        const reg = 360 - this.rotateDeg;
        this.rotate(reg);
    };

    /*** 涂鸦相关 ***/
    // 开启涂鸦
    public activeGraffifi = () => {
        if (!this.state.isGraffitiActive) {
            this.setState({
                isGraffitiActive: true,
            });
        }
    };

    // 关闭涂鸦
    public muteGraffiti = () => {
        if (this.state.isGraffitiActive) {
            this.upperDrawer.canvas.style.cursor = CURSOR['default'];
            this.setState({
                isGraffitiActive: false,
            });
        }
    };

    // 开启涂鸦弹窗
    private openGraffitiStyleModal = () => {
        this.setState({
            isGraffitiStyleModalShow: true,
        });
    };

    // 关闭涂鸦弹窗
    private closeGraffitiStyleModal = () => {
        this.setState({
            isGraffitiStyleModalShow: false,
        });
    };

    // 渲染涂鸦弹窗
    private renderGraffitiStyleModal = () => {
        const { isGraffitiStyleModalShow } = this.state;

        if (!this.currentSprite) {
            return null;
        }

        const { type, options, key } = this.currentSprite as GraffitiSprite;
        if (!isGraffitiStyleModalShow || type !== 'graffiti') {
            return null;
        }

        const { x, y, height } = this.currentSprite.canvasPosition();
        const { width: canvasWidth, height: canvasHeight } = this.state.canvasSize;

        const posX = x < 0 ? 0 : x > canvasWidth ? canvasWidth : x;
        let posY = y + height + 5;
        posY = posY < 0 ? 0 : posY > canvasHeight ? canvasHeight : posY;

        const onStyleChange = style => {
            this.recordSpriteChangeHistroty(key, () => {
                this.upperDrawer.changeGraffitiStyle((this.currentSprite as Sprite).key, style);
            });
        };

        return (
            <GrafftiStyleModal
                position={{ x: posX, y: posY }}
                onStyleChange={onStyleChange}
                options={{ ...this.props.graffitiOptions, defaultOption: options }}
            />
        );
    };

    /*** 放大相关 ***/

    // 基于画布中心点放大
    public zoom = (scale: number) => {
        const midPoint = {
            x: this.state.canvasSize.width / 2,
            y: this.state.canvasSize.height / 2,
        };

        this.scaleWithHistory(midPoint, scale);
        // 统一绘制
        this.imageDrawer.paint();
        this.upperDrawer.paint();
    };

    /*** 历史记录相关 ***/

    // 历史记录前进
    public forward = () => {
        this.history.forward();
    };

    // 历史记录后退
    public back = () => {
        this.history.back();
    };

    render() {
        const {
            textMaxLength = 20,
            inputStyle,
            textOptions,
            activeOptions,
            placeholder,
            disabled,
            toolbarDisabled,
            backgroundColors,
            toolbarExclude,
            toolbarEventOverwrite,
        } = this.props;
        const {
            image,
            canvasSize,
            isImageLoad,
            isImageLoadFail,
            showInputModal,
            inputValue,
            isCutShow,
            backgroundColor,
        } = this.state;
        const { width, height } = canvasSize;
        const inputDisplayStyle = Object.assign({}, inputStyle);
        if (!image || !isImageLoad) {
            return (
                <Loading
                    isImageLoadFail={isImageLoadFail}
                    width={width}
                    height={height}
                    tryLoadAgain={() => this.initStage(true)}
                />
            );
        }

        if (textOptions) {
            const { color, font_size } = textOptions;
            if (color) {
                inputDisplayStyle.color = `rgba(${color.red},${color.green},${color.blue},${color.alpha})`;
            }
            if (font_size) {
                inputDisplayStyle.fontSize = `${font_size}px`;
                inputDisplayStyle.lineHeight = `${font_size * 1.5}px`;
            }
        }

        return (
            <div
                className="component-draw-tools"
                style={toolbarDisabled ? {} : { marginRight: '67px' }}
                data-handle-key={this.id}
            >
                <PreLoad instance={this} />

                <div
                    style={{ position: 'relative', width, height }}
                    ref={this.getCanvasContainer}
                    id={`drawer-wrapper-${this.id}`}
                    onMouseDown={this.handleMousedown}
                    onMouseMove={this.handleMousemove}
                    onMouseUp={e => this.handleMouseEnd(e)}
                    onMouseOut={e => this.handleMouseEnd(e)}
                >
                    <UpperDrawer
                        ref={drawer => drawer && (this.upperDrawer = drawer)}
                        id={this.id}
                        width={width}
                        height={height}
                        originImage={image}
                        activeOptions={activeOptions}
                        axis={this.axis}
                    />
                    <ImageDrawer
                        ref={drawer => drawer && (this.imageDrawer = drawer)}
                        image={image}
                        width={width}
                        height={height}
                        axis={this.axis}
                        backgroundColor={backgroundColor}
                    />
                </div>

                {isCutShow && (
                    <Cut
                        width={width}
                        height={height}
                        zoom={0.3}
                        imageUrl={this.props.imgUrl}
                        onFinish={this.onCutFinish}
                        onCancel={() => {
                            this.closeCutMode();
                        }}
                        backgroundColors={backgroundColors}
                    />
                )}
                {!toolbarDisabled && (
                    <Tools
                        stage={this}
                        disabled={disabled}
                        exclude={toolbarExclude}
                        eventOverwrite={toolbarEventOverwrite}
                    />
                )}
                <div style={{ position: 'absolute', width, height }}>
                    <div
                        className="correct-input-component"
                        style={{ display: showInputModal ? 'block' : 'none' }}
                        ref={input => input && (this.myInput = input)}
                        onKeyDown={this.handleKeyboardInput}
                    >
                        <textarea
                            style={inputDisplayStyle}
                            placeholder={placeholder}
                            maxLength={textMaxLength}
                            onChange={this.handleInputChange}
                            value={inputValue}
                        />
                        {this.renderAnnotate()}
                    </div>
                    {this.renderGraffitiStyleModal()}
                    {this.renderTextStyle()}
                </div>
            </div>
        );
    }
}
