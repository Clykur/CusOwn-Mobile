/// <reference types="nativewind/types" />

import 'react-native';

declare module 'react-native/Libraries/Components/View/ViewPropTypes' {
  interface ViewProps {
    className?: string;
  }
}

declare module 'react-native/Libraries/Text/Text' {
  interface TextProps {
    className?: string;
  }
}

declare module 'react-native/Libraries/Components/Touchable/TouchableWithoutFeedback' {
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
}

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ActivityIndicatorProps {
    className?: string;
  }
}

