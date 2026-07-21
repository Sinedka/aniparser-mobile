{
  pkgs ? import <nixpkgs> {
    config = {
      android_sdk.accept_license = true;
      allowUnfree = true;
    };
  },
  ...
}:
let
  androidComposition = pkgs.androidenv.composeAndroidPackages {
    toolsVersion = "26.1.1";
    platformToolsVersion = "36.0.2";
    buildToolsVersions = [
      "35.0.0"
      "36.0.0"
    ];

    includeEmulator = true;
    emulatorVersion = "36.4.2";

    includeSystemImages = true;
    # This generate cartesian product of defined image options
    # For example below
    # system-images;android-27;default;x86_64
    # system-images;android-34;default;x86_64
    platformVersions = [
      "27"
      "33"
      "34"
      "36"
    ];
    abiVersions = [ "x86_64" ];
    systemImageTypes = [ "google_apis_playstore" ];

    includeSources = false;
    includeNDK = true;
    useGoogleAPIs = false;

    includeCmake = true;
    cmakeVersions = [ "3.22.1" ];

    # Uncomment if you use something, that require extra license
    extraLicenses = [
      # "android-sdk-preview-license"
      # "android-googletv-license"
      # "android-sdk-arm-dbt-license"
      # "google-gdk-license"
      # "intel-android-extra-license"
      # "intel-android-sysimage-license"
      # "mips-android-sysimage-license"
    ];
  };
  androidSdk = androidComposition.androidsdk;
in
pkgs.mkShell rec {
  buildInputs = with pkgs; [
    # You could use Android Studio with this devshell
    # But them reuse your ~/.config/Google/AndroidStudio* configuration
    #
    # If you already setup some SDK and want instead use {androidSdk} defined here,
    # change path in Android Studio settings. If you don't do that, you can get weird
    # errors inside Virtual Device Manager, caused by differences between two SDK.
    #
    # If your configuration folder is empty, Android Studio will find
    # SDK by your ANDROID_HOME path. And detected that it accessible RO
    # This trigger error "The Android SDK location cannot be at the filesystem root"
    # And don't allow you use Virtual Device Manager.
    # Do not run them as root, because it can change some files in /nix directory
    # As workaround, import some previous configuration if it exist, otherwise
    # install Android SDK from SDK manager to some writable directory as usual
    # and after that, change SDK in settings
    # You also can temporary configure overlayFS and use them

    # android-studio
    libGLU
    libGL
    dotslash
    androidSdk
    react-native-debugger
    jdk17
    nodejs
    (callPackage (
      { pkgs, ... }:
      pkgs.androidenv.emulateApp rec {
        name = "android-emu-default-api34-x86_64";
        deviceName = name;
        platformVersion = "36";
        abiVersion = "x86_64";
        systemImageType = "google_apis_playstore";
        sdkExtraArgs = {
          emulatorVersion = "36.3.10";
        };
        configOptions = {
          "hw.gpu.enabled" = "yes";
          "hw.gpu.mode" = "host";
          "hw.keyboard" = "yes";
          "hw.device.manufacturer" = "Google";
          "hw.device.model" = "Pixel 8";
          "hw.cpu.ncore" = "8";
          "hw.ramSize" = "8192";
        };
        avdHomeDir = "$HOME/.android/avd";
        # androidAvdFlags = "--device 42";
      }
    ) { })
  ];
  shellHook = ''
    export ANDROID_HOME="${androidSdk}/libexec/android-sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export ANDROID_USER_HOME="$HOME/.android"
    export ANDROID_AVD_HOME="$HOME/.android/avd"

    # On wayland may not work correctly without this
    export QT_QPA_PLATFORM="xcb"
    export VK_DRIVER_FILES=/run/opengl-driver/share/vulkan/icd.d/nvidia_icd.json
    # Fix some kind of errors with vulkan
    export LD_LIBRARY_PATH="${pkgs.libglvnd}/lib":$LD_LIBRARY_PATH
    # export VK_ICD_FILENAMES="/run/opengl-driver/share/vulkan/icd.d/nvidia_icd.json"
    # export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:${pkgs.lib.makeLibraryPath [ pkgs.vulkan-loader ]}"
    # export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:${pkgs.lib.makeLibraryPath buildInputs }"
    # export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/run/opengl-driver/lib:/run/opengl-driver-32/lib"

    # export __EGL_VENDOR_LIBRARY_FILENAMES=/run/opengl-driver/share/glvnd/egl_vendor.d/10_nvidia.json 

    alias run-test-emulator="__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia __NV_PRIME_RENDER_OFFLOAD_PROVIDER=NVIDIA-G0 __VK_LAYER_NV_optimus=NVIDIA_only run-test-emulator"
  '';
}
