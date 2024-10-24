{ pkgs, lib, config, inputs, ... }:

{
  packages = [ pkgs.git ];

  languages.javascript = {
    enable = true;
    yarn.enable = true;
  };

  enterShell = ''
    git --version
    node --version
    yarn install
  '';

  pre-commit.hooks.eslint.enable = true;
}
