declare module "vscode/lib/testrunner" {

	namespace runner{
		function configure(options: object): any;
	}

	export = runner;
}
