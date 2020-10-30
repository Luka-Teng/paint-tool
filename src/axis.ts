/**
 * 三层坐标系
 * canvas层，参照坐标系，不做变动
 * sprite层，绘制层，用于记录平移，放大等参数
 * origin层，数据层，用于输出后端数据
 */
type PointType = {
	x: number;
	y: number;
}

/**
 * sprite坐标系参数
 * zeroX, zeroY相对于canvas坐标系的原点位置
 * scale缩放比例
 */
type SpriteAxisType = {
	zeroX: number;
	zeroY: number;
	scale: number;
}

/**
 * origin坐标系参数
 * zeroX, zeroY相对于sprite坐标系的原点位置
 * scale缩放比例
 */
type OriginAxisType = {
	zeroX: number;
	zeroY: number;
	scale: number;
}

type SizeType = {
  width: number;
  height: number;
}

type RatioType = {
	x: number;
	y: number;
}

class Axis {
  // 当前画布大小
	public canvasSize: SizeType

  // 原图大小
  public imageSize: SizeType

  // 参照于canvas坐标系的
	public spriteAxis: SpriteAxisType

	// 参照于sprite坐标系的
	public originAxis: OriginAxisType

	// 原图拉伸比例
	public ratio: RatioType

	// 初始状态
	public initState: {
		spriteAxis: SpriteAxisType;
		originAxis: OriginAxisType;
		ratio: RatioType;
		canvasSize: SizeType;
		imageSize: SizeType;
	}

  constructor (canvasSize, imageSize) {
		this.init(canvasSize, imageSize);
	}

	public init = (canvasSize: SizeType, imageSize: SizeType) => {
		this.canvasSize = canvasSize;
    this.imageSize = imageSize;

    this.spriteAxis = {
      zeroX: 0,
      zeroY: 0,
      scale: 1
    };
    this.originAxis = {
      zeroX: 0,
      zeroY: 0,
      scale: 1
		};
		this.ratio = {
			x: this.canvasSize.width / this.imageSize.width,
			y: this.canvasSize.height / this.imageSize.height
		};
		this.initState = {
			spriteAxis: { ...this.spriteAxis },
			originAxis: { ...this.originAxis },
			ratio: { ...this.ratio },
			canvasSize: { ...canvasSize },
			imageSize: { ...imageSize }
		};
	}

	/**
	 * 重制坐标系
	 * 1. 重制所有
	 * 2. 重制sprite坐标系
	 * 3. 重制origin坐标系
	 */
	public resetAxis = (type?: 'sprite' | 'origin') => {
		if (!type || type === 'sprite') {
			this.spriteAxis = {...this.initState.spriteAxis};
		}

		if (!type || type === 'origin') {
			this.originAxis = {...this.initState.originAxis};
		}
	}

	/**
	 * 初始化
	 * 1. 初始化坐标系
	 * 2. 初始化canvasSize
	 * 3. 初始化imageSize
	 * 4. 初始化ratio
	 */
	public reset = () => {
		this.resetAxis();
		this.updateCanvasSize(this.initState.canvasSize);
		this.updateImageSize(this.initState.imageSize);
		this.updateRatio(this.initState.ratio);
	}

	/**
	 * 更新原图的拉伸比例
	 * 可以传入ratio直接更新
	 * 也可以传入命令，进行快速更新
	 */
	public updateRatio = (ratio: RatioType | string) => {
		if (typeof ratio === 'string') {
			if (ratio === 'swap') {
				this.ratio = {
					x: this.ratio.y,
					y: this.ratio.x
				};
			}
			return;
		}
		this.ratio = ratio;
	}

	public updateCanvasSize = (canvasSize: SizeType) => {
		this.canvasSize = canvasSize;
	}

	public updateImageSize = (imageSize: SizeType) => {
		this.imageSize = imageSize;
	}

	public setSpriteScale = (scale: number) => {
		this.spriteAxis.scale = scale;
	}

	public setSpriteZeroPoint = (point: PointType) => {
		this.spriteAxis.zeroX = point.x;
		this.spriteAxis.zeroY = point.y;
	}

	public setOriginScale = (scale: number) => {
		this.originAxis.scale = scale;
	}

	public setOriginZeroPoint = (point: PointType) => {
		this.originAxis.zeroX = point.x;
		this.originAxis.zeroY = point.y;
	}

	// 点坐标canvas => sprite
	public pointCanvas2Sprite = (point: PointType) => {
		const { zeroX, zeroY, scale } = this.spriteAxis;
		const { x, y } = point;
		return {
			x: (x - zeroX) / scale,
			y: (y - zeroY) / scale
		};
	}

	// 点坐标sprite => origin
	public pointSprite2Origin = (point: PointType) => {
		const { scale } = this.originAxis;
    const { x, y } = point;
		return {
			x: x / scale / this.ratio.x,
			y: y / scale / this.ratio.y
		};
	}

	// 点坐标canvas => origin
	public pointCanvas2Origin = (point: PointType) => {
		return this.pointSprite2Origin(this.pointCanvas2Sprite(point));
	}

	// 点坐标origin => sprite
	public pointOrigin2Sprite = (point: PointType) => {
		const { scale } = this.originAxis;
		const { x, y } = point;
		return {
			x: x * scale * this.ratio.x,
			y: y * scale * this.ratio.y
		};
	}

	// 点坐标sprite => canvas
	public pointSprite2Canvas = (point: PointType) => {
		const { zeroX, zeroY, scale } = this.spriteAxis;
		const { x, y } = point;
		return {
			x: x * scale + zeroX,
			y: y * scale + zeroY
		};
	}

	// 点坐标origin => canvas
	public pointOrigin2Canvas = (point: PointType) => {
		return this.pointSprite2Canvas(this.pointOrigin2Sprite(point));
	}

	// 线段canvas => sprite
	public lengthCanvas2Sprite = (length: number) => {
		const { scale } = this.spriteAxis;
		return length / scale;
	}

	// 线段sprite => origin
	public lengthSprite2Origin = (length: number, type: 'x' | 'y') => {
    const { scale } = this.originAxis;
		return length / scale / (type === 'x' ? this.ratio.x : this.ratio.y);
	}

	// 线段canvas => origin
	public lengthCanvas2Origin = (length: number, type: 'x' | 'y') => {
		return this.lengthSprite2Origin(this.lengthCanvas2Sprite(length), type);
	}

	// 线段origin => sprite
	public lengthOrigin2Sprite = (length: number, type: 'x' | 'y') => {
		const { scale } = this.originAxis;
		return length * scale * (type === 'x' ? this.ratio.x : this.ratio.y);
	}

	// 线段sprite => canvas
	public lengthSprite2Canvas = (length: number) => {
		const { scale } = this.spriteAxis;
		return length * scale;
	}

	// 线段origin => canvas
	public lengthOrigin2Canvas = (length: number, type: 'x' | 'y') => {
		return this.lengthSprite2Canvas(this.lengthOrigin2Sprite(length, type));
	}

	/* 由于在实际操作过程中，canvas坐标是最直接的，所以统一用canvas坐标进行操作 */

	/**
	 * 通过某一点缩放，所造成的sprite坐标系的改变
	 * zoom点为canvas坐标
	 */
	public scaleSprite = (point: PointType, scale: number) => {
		const { zeroX, zeroY, scale: prevScale } = this.spriteAxis;
		const { x, y } = point;

		// 在这边对最小scale做限制，并且在scale = 1的时候强制回正
		const currentScale = scale * prevScale;
		if (currentScale <= 1) {
			this.setSpriteScale(1);
			this.setSpriteZeroPoint({
				x: 0,
				y: 0
			});
		} else {
			this.setSpriteScale(currentScale);
			this.setSpriteZeroPoint({
				x: -(currentScale / prevScale * (x - zeroX) - x),
				y: currentScale / prevScale * (zeroY - y) + y
			});
		}
	}

	/**
	 * 通过位移，所造成的sprite坐标系的改变
	 * 鼠标移动的距离是canvas坐标距离
	 */
	public translateSprite = (distanceX: number, distanceY: number) => {
		const { zeroX, zeroY } = this.spriteAxis;

		this.setSpriteZeroPoint({
			x: zeroX + distanceX,
			y: zeroY + distanceY
		});
	}

	/**
	 * 通过拉伸改变原图坐标系
	 * 参数是相对于sprite坐标系的坐标和缩放量
	 */
	public changeOrigin = (point: PointType, scale?: number) => {
		scale && this.setOriginScale(scale);
		this.setOriginZeroPoint(point);
	}

	/*** 业务相关的坐标系逻辑 ***/

	/**
	 * 裁剪逻辑处理
	 * 1. 初始化
	 * 2. 更新canvasize
	 * 4. 改变原图坐标系
	 */
	public cut = (canvasSize: SizeType, originPoint: PointType, originScale: number) => {
    this.reset();
		this.updateCanvasSize(canvasSize);
    this.changeOrigin(originPoint, originScale);
	}

	/**
	 * 旋转逻辑处理
	 */
	public rotate = (deg: number) => {
		const { zeroX, zeroY } = this.originAxis;
		const { width, height } = this.canvasSize;
		let newZeroX = zeroX;
		let newZeroY = zeroY;

		// 重制sprite坐标系
		this.resetAxis('sprite');

		// 坐标系旋转计算
		switch (deg) {
			case 90:
				newZeroY = zeroX;
				newZeroX = height - zeroY - this.lengthOrigin2Sprite(this.imageSize.height, 'y');
				this.updateCanvasSize({ height: width, width: height });
				this.updateImageSize({height: this.imageSize.width, width: this.imageSize.height });
				this.updateRatio('swap');
				break;
			case 180:
				newZeroX = width - zeroX - this.lengthOrigin2Sprite(this.imageSize.width, 'x');
				newZeroY = height - zeroY - this.lengthOrigin2Sprite(this.imageSize.height, 'y');
				break;
			case 270:
				newZeroX = zeroY;
				newZeroY = width - zeroX - this.lengthOrigin2Sprite(this.imageSize.width, 'x');
				this.updateImageSize({height: this.imageSize.width, width: this.imageSize.height });
				this.updateCanvasSize({ height: width, width: height });
				this.updateRatio('swap');
				break;
		}

    this.changeOrigin({
      x: newZeroX,
      y: newZeroY
		});
	}
}

export default Axis;
