export interface FormatForm {
    tabSize: number;
}

export interface Config {
    orderList: string[];
    changeOnSave: boolean;
    showErrorMessages: boolean;
    autoFormat: boolean;
    formatForm: FormatForm;
    // 그냥 클래스, :hover 이런 순서
}
