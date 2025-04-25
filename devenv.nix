{ pkgs, lib, config, inputs, ... }:

{
  languages.javascript = {
    enable = true;
    yarn.enable = true;
  };

  enterShell = ''
    node --version
  '';

  pre-commit.hooks.eslint.enable = true;
}
