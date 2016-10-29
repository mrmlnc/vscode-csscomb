declare module "detect-indent" {

	function di(text: string): { indent: string }

	namespace di { }
	export = di;
}
