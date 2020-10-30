import Stage, { ICorrectToolProps } from './stage';
import {
  IPosition,
  ISpriteData,
  ITextOptions,
  IRectOptions,
  IOldSpriteData,
  IActiveOptions,
  IImgSpriteData,
  ITempSpriteData,
  ITextSpriteData,
  IRectSpriteData
} from './types';
import { newAction2old, newData2old, oldAction2new, oldData2new } from './normalize';

export default Stage;
export {
  IPosition,
  ISpriteData,
  ITextOptions,
  IRectOptions,
  IActiveOptions,
  IOldSpriteData,
  IImgSpriteData,
  IRectSpriteData,
  ITextSpriteData,
  ITempSpriteData,
  ICorrectToolProps,

  newData2old,
  newAction2old,
  oldData2new,
  oldAction2new
};