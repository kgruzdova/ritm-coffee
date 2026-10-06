import { assetUrl } from '../lib/assets';

export default function AssetImage({ name, alt = '', className, eager = false, sizes = '(max-width: 700px) 65vw, 30vw', ...props }) {
  const isLandscape = name === 'lifestyle';
  const isSquare = ['cinnamon', 'latte-mug', 'espresso-mug', 'flat-white', 'macarons'].includes(name) || name.startsWith('coffee-guide-');
  return <picture className={className}>
    <source type="image/avif" srcSet={`${assetUrl(`${name}-480.avif`)} 480w, ${assetUrl(`${name}.avif`)} ${isLandscape ? 1440 : 960}w`} sizes={sizes} />
    <img src={assetUrl(`${name}.webp`)} srcSet={`${assetUrl(`${name}-480.webp`)} 480w, ${assetUrl(`${name}.webp`)} ${isLandscape ? 1440 : 960}w`} sizes={sizes} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" width={isLandscape ? 1440 : 960} height={isLandscape || isSquare ? 960 : 1440} {...props} />
  </picture>;
}
