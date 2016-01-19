function Controller()
{
    installer.setValue("UserTargetDir", installer.value("TargetDir"));

    var isAdmin = false;
    if (installer.value("os") === "win") {
        var testAdmin = installer.execute("cmd", ["/c", "net", "session"]);
        if(testAdmin.length > 1 && testAdmin[1] == 0)
            isAdmin = true;
    } else {
        var testAdmin = installer.execute("id", ["-u"]);//TODO test
        if(testAdmin.length > 1 && testAdmin[1] == 0)
            isAdmin = true;
    }

    installer.setValue("isAdmin", isAdmin ? "true" : "false");
    installer.setValue("AllUsers", isAdmin ? "true" : "false");
}

Controller.prototype.IntroductionPageCallback = function()
{
    if(!installer.isInstaller()) {
        var widget = gui.currentPageWidget();
        if (widget !== null) {

            var comps = installer.components();
            var isOnline = false;
            for (i = 0; i < comps.length; ++i) {
                if(comps[i].isFromOnlineRepository())
                    isOnline = true;
            }

            if(!isOnline) {
                widget.findChild("PackageManagerRadioButton").visible = false;
                widget.findChild("UpdaterRadioButton").visible = false;
                widget.findChild("UninstallerRadioButton").checked = true;
                gui.clickButton(buttons.NextButton);
            } else {
                if (installer.isUninstaller() && installer.value("uninstallOnly") === "1") {
                    widget.findChild("PackageManagerRadioButton").checked = false;
                    widget.findChild("UpdaterRadioButton").checked = false;
                    widget.findChild("UninstallerRadioButton").checked = true;
                    gui.clickButton(buttons.NextButton);
                } else if (installer.isUpdater()) {
                    widget.findChild("PackageManagerRadioButton").checked = false;
                    widget.findChild("UpdaterRadioButton").checked = true;
                    widget.findChild("UninstallerRadioButton").checked = false;
                    gui.clickButton(buttons.NextButton);
                } else if(installer.isPackageManager()) {
                    widget.findChild("PackageManagerRadioButton").checked = true;
                    widget.findChild("UpdaterRadioButton").checked = false;
                    widget.findChild("UninstallerRadioButton").checked = false;
                    gui.clickButton(buttons.NextButton);
                }
            }
        }
    }
}

Controller.prototype.DynamicUserPageCallback = function()
{
    var page = gui.pageWidgetByObjectName("DynamicUserPage");
    if(page !== null) {
        if (installer.value("isAdmin") === "true") {
            page.allUsersButton.checked = installer.value("AllUsers") === "true";
            page.meOnlyButton.checked = installer.value("AllUsers") !== "true";
            page.allUsersButton.enabled = true;
            page.allUsersLabel.enabled = true;
        } else {
            page.meOnlyButton.checked = true;
            page.allUsersButton.checked = false;
            page.allUsersButton.enabled = false;
            page.allUsersLabel.enabled = false;
        }
    }
}

Controller.prototype.TargetDirectoryPageCallback = function()
{
    var page = gui.pageWidgetByObjectName("DynamicUserPage");
    if (page !== null && page.allUsersButton.checked) {
        installer.setValue("AllUsers", "true");
        installer.setValue("TargetDir", installer.value("AdminTargetDir"));
    } else {
        installer.setValue("AllUsers", "false");
        installer.setValue("TargetDir", installer.value("UserTargetDir"));
    }

    if (installer.value("os") === "win") {
        var orgFolder = installer.value("TargetDir");
        var programFiles = installer.environmentVariable("ProgramW6432");
        var localProgFiles = installer.environmentVariable("ProgramFiles");
        installer.setValue("TargetDir", orgFolder.replace(localProgFiles, programFiles));
    }
    var widget = gui.currentPageWidget();
    if (widget !== null)
        widget.TargetDirectoryLineEdit.text = installer.value("TargetDir").replace("\\", "/");
}

Controller.prototype.FinishedPageCallback = function()
{
    if (installer.isInstaller() && installer.value("os") === "win") {
        var isAllUsers = (installer.value("AllUsers") === "true");
        if(!isAllUsers || installer.gainAdminRights()){
            var args  = [
                            installer.value("ProductUUID"),
                            "@TargetDir@\\@MaintenanceToolName@.exe",
                            isAllUsers ? "HKEY_LOCAL_MACHINE" : "HKEY_CURRENT_USER",
                            installer.isOfflineOnly() ? 0 : 1
                        ];
            installer.execute("@TargetDir@/regSetUninst.bat", args);
        }
    }
}
