{
  description = "Different ways to setup Android SDK";

  inputs = {
    # This flake probably should work on stable branch, but I don't test
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" ];
      forSingleSystem = system: f:
          f rec {
            pkgs = import nixpkgs { 
              inherit system;
              config = {
                # android-studio and some parts of SDK's distributed as unfree
                allowUnfree = true;
                # Accept android-sdk license here
                android_sdk.accept_license = true;
              };
            };
          };
      forAllSystems = f:
        nixpkgs.lib.genAttrs systems (system: forSingleSystem system f);
    in {
      # Use nix develop to run any of this. As example:
      # nix develop ".#shell-with-sdk" -c "$SHELL" 
      devShells = forAllSystems (args: {
        default = import ./shell-with-sdk.nix args;
      });
    };
}
