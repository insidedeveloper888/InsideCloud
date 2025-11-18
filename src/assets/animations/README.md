# Lottie Animations

This folder contains JSON animation files for your application background.

## How to Use

1. Download a free animation from [LottieFiles](https://lottiefiles.com)
2. Select the **JSON** download format (not MP4, not GIF)
3. Place the `.json` file in this directory
4. Import it in your component like this:

```javascript
import animationData from '../../assets/animations/your-animation-name.json';
import Lottie from 'lottie-react';

// In your component
<Lottie
  animationData={animationData}
  loop={true}
  autoplay={true}
  style={{ width: '100%', height: '100%' }}
/>
```

## Recommended Animations

For a full-screen background, search for:
- "abstract background"
- "animated gradient"
- "particles animation"
- "animated shapes"
- "smooth background"
- "floating elements"

Make sure to choose animations that:
- Have **high performance** (look for performance scores on LottieFiles)
- Are **loop-friendly** (they should repeat smoothly)
- Have a **dark or neutral background** that complements your UI

## Example Usage in LoadingState

```javascript
import Lottie from 'lottie-react';
import animationData from '../../assets/animations/background-animation.json';

const LoadingState = () => (
  <div className="lottie-background-container">
    <div className="lottie-animation-wrapper">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
      />
    </div>
    <div className="lottie-placeholder">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
      <p className="text-base text-white mt-4">Authenticating with Lark…</p>
    </div>
  </div>
);
```

## Current Status

The structure is ready! You just need to:
1. Download your animation from LottieFiles in JSON format
2. Save it to this directory as `background-animation.json` (or any name you prefer)
3. Update your component imports to use it
