var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { createUuid, Bcf, CommunicatorError, FileType } from "@hoops/web-viewer";
class BCFTree {
  constructor(viewer, elementId, iScroll) {
    __publicField(this, "_viewer");
    __publicField(this, "_elementId");
    __publicField(this, "_listRoot");
    __publicField(this, "_bcfDataList");
    __publicField(this, "_scroll");
    __publicField(this, "_idCount", 0);
    __publicField(this, "_viewpointIdMap", /* @__PURE__ */ new Map());
    __publicField(this, "_bcfIdMap", /* @__PURE__ */ new Map());
    __publicField(this, "_topicGuidMap", /* @__PURE__ */ new Map());
    __publicField(this, "_topicTitleGuidMap", /* @__PURE__ */ new Map());
    __publicField(this, "_topicCommentsGuidMap", /* @__PURE__ */ new Map());
    __publicField(this, "_commentGuidMap", /* @__PURE__ */ new Map());
    this._viewer = viewer;
    this._elementId = elementId;
    this._scroll = iScroll;
    this._listRoot = document.createElement("ul");
    this._bcfDataList = document.createElement("select");
    this._initEvents();
  }
  hideTab() {
    $(`#${this._elementId}Tab`).hide();
  }
  showTab() {
    $(`#${this._elementId}Tab`).show();
  }
  getElementId() {
    return this._elementId;
  }
  _refreshScroll() {
    if (this._scroll) {
      this._scroll.refresh();
    }
  }
  _showBCFData(bcfId) {
    jQuery(`#${bcfId}`).show();
    this._bcfIdMap.forEach((_id, _bcfId) => {
      if (_bcfId !== bcfId) {
        jQuery(`#${_bcfId}`).hide();
      }
    });
    this._refreshScroll();
  }
  _events(container) {
    $(container).on("click", ".ui-bcf-topic", (event) => {
      const $target = jQuery(event.target);
      const listItem = $target.closest(".viewpoint, .comment").get(0);
      if (listItem !== void 0) {
        this._onTreeSelectItem(listItem.id);
      }
    });
    $(container).on("change", "select", (event) => {
      const $target = jQuery(event.target);
      const selectItem = $target.closest("select").get(0);
      if (selectItem) {
        this._showBCFData(selectItem.value);
      }
    });
  }
  async _addBCFComment(topic, text, markupView) {
    const markup = topic.getMarkup();
    const date = /* @__PURE__ */ new Date();
    const author = "";
    const viewpointSnapshotGuid = createUuid();
    const viewpointFilename = `${viewpointSnapshotGuid}.bcfv`;
    const viewpoint = await Bcf.BCFViewpoint.createViewpoint(
      this._viewer,
      viewpointFilename,
      markupView
    );
    topic.setViewpoint(viewpointFilename, viewpoint);
    const snapshotFilename = `${viewpointSnapshotGuid}.png`;
    await this._addSnapshot(topic, snapshotFilename);
    markup.addViewpoint(viewpointSnapshotGuid, viewpointFilename, snapshotFilename);
    return markup.addComment(date, author, text, viewpointSnapshotGuid);
  }
  async _addSnapshot(topic, snapshotFilename) {
    const img = await this._viewer.takeSnapshot();
    topic.addSnapshot(snapshotFilename, Bcf.BCFSnapshot.snapshotDataFromImage(img));
  }
  /** @hidden */
  _removeBcf(bcfId) {
    this._viewer.BCFManager.removeBCFData(bcfId);
  }
  _buildRemoveBCF(bcfId) {
    const element = document.createElement("div");
    element.classList.add("ui-bcf-input");
    const removeBcfButton = document.createElement("button");
    removeBcfButton.textContent = "Remove BCF";
    element.appendChild(removeBcfButton);
    removeBcfButton.onclick = async () => {
      this._removeBcf(bcfId);
    };
    return element;
  }
  /** @hidden */
  async _addBcf(bcfName) {
    const viewer = this._viewer;
    const bcfManager = viewer.BCFManager;
    const bcfData = bcfManager.createBCFData(bcfName);
    await this._addTopic(bcfData, bcfName);
    return bcfData;
  }
  _buildAddBCF() {
    const element = document.createElement("div");
    element.classList.add("ui-bcf-input");
    const label = document.createElement("label");
    label.textContent = "BCF Name: ";
    label.htmlFor = "bcf_name";
    const input = document.createElement("input");
    input.id = "bcf_name";
    input.placeholder = "BCF Name...";
    const addBcfButton = document.createElement("button");
    addBcfButton.textContent = "Add BCF";
    element.appendChild(label);
    element.appendChild(input);
    element.appendChild(addBcfButton);
    addBcfButton.onclick = async () => {
      const bcfName = input.value;
      if (bcfName.length > 0) {
        input.value = "";
        await this._addBcf(bcfName);
      }
    };
    return element;
  }
  _buildOpenBCF() {
    const element = document.createElement("div");
    element.classList.add("ui-bcf-input");
    const bcfFileInput = document.createElement("input");
    bcfFileInput.type = "file";
    bcfFileInput.accept = ".bcf,.bcfzip";
    bcfFileInput.multiple = true;
    element.appendChild(bcfFileInput);
    bcfFileInput.onchange = async () => {
      const fileList = bcfFileInput.files;
      if (fileList !== null) {
        for (let i = 0; i < fileList.length; ++i) {
          const file = fileList[i];
          const fileReader = new FileReader();
          fileReader.onload = async () => {
            const result = fileReader.result;
            if (result !== null && typeof result === "object") {
              await this._viewer.BCFManager.addBCFFromBuffer(result, file.name.split(".")[0]);
            }
          };
          fileReader.readAsArrayBuffer(file);
        }
      }
      bcfFileInput.value = "";
    };
    return element;
  }
  /** @hidden */
  async _addTopic(bcfData, topicTitle) {
    const activeView = this._viewer.markupManager.getActiveMarkupView();
    const topic = await Bcf.BCFTopic.createTopic(
      this._viewer,
      bcfData.getId(),
      bcfData.getFilename(),
      topicTitle,
      activeView
    );
    bcfData.addTopic(topic.getTopicId(), topic);
    const topicElement = this._buildTopic(bcfData, topic);
    const bcfHtmlId = this._getBcfHtmlId(bcfData.getId());
    if (bcfHtmlId !== null) {
      const element = document.getElementById(bcfHtmlId);
      if (element !== null) {
        element.appendChild(topicElement);
      }
    }
    return topic;
  }
  _buildAddTopic(bcfData) {
    const addTopicElement = document.createElement("div");
    addTopicElement.classList.add("ui-bcf-input");
    const label = document.createElement("label");
    label.textContent = "Topic Title: ";
    label.htmlFor = "topic_title";
    const input = document.createElement("input");
    input.id = "topic_title";
    input.placeholder = "Topic Title...";
    const addTopicButton = document.createElement("button");
    addTopicButton.textContent = "Add Topic";
    addTopicElement.appendChild(label);
    addTopicElement.appendChild(input);
    addTopicElement.appendChild(addTopicButton);
    addTopicButton.onclick = async () => {
      const topicTitle = input.value;
      if (topicTitle.length > 0) {
        input.value = "";
        await this._addTopic(bcfData, topicTitle);
      }
    };
    return addTopicElement;
  }
  _initEvents() {
    const container = document.getElementById(this._elementId);
    if (container === null) {
      throw new CommunicatorError("container is null");
    }
    this._events(container);
    container.appendChild(this._buildAddBCF());
    container.appendChild(this._buildOpenBCF());
    this._listRoot.classList.add("ui-modeltree");
    this._listRoot.classList.add("ui-modeltree-item");
    container.appendChild(this._bcfDataList);
    container.appendChild(this._listRoot);
    this._viewer.setCallbacks({
      firstModelLoaded: (modelRootIds) => {
        const model = this._viewer.model;
        modelRootIds.forEach((rootId) => {
          if (model.getModelFileTypeFromNode(rootId) === FileType.Ifc) {
            this.showTab();
          }
        });
      },
      bcfLoaded: (id, filename) => {
        this.showTab();
        this._appendBCF(id, filename);
      },
      bcfRemoved: (id) => {
        this._removeBCF(id);
      }
    });
  }
  _buildBCFNode(id) {
    const element = document.createElement("li");
    element.classList.add("ui-modeltree-item");
    element.id = id;
    return element;
  }
  _buildDiv(id, text, elementClass) {
    const element = document.createElement("div");
    if (elementClass !== void 0) {
      element.classList.add(elementClass);
    }
    element.id = id;
    element.innerHTML = text;
    return element;
  }
  _buildEditDiv(id, text, placeholderText, callback, elementClass) {
    const element = document.createElement("input");
    element.classList.add("ui-bcf-edit");
    if (elementClass !== void 0) {
      element.classList.add(elementClass);
    }
    element.id = id;
    element.value = text;
    element.placeholder = placeholderText;
    element.onblur = () => {
      if (callback !== void 0 && element.textContent !== null) {
        callback(element.textContent);
      }
    };
    return element;
  }
  _buildImage(url) {
    const element = document.createElement("img");
    element.id = this._getId();
    element.src = url;
    return element;
  }
  _buildDeleteComment(bcfTopic, bcfComment, commentElementId) {
    const button = document.createElement("button");
    button.classList.add("ui-bcf-comment-delete");
    button.textContent = "Delete";
    button.onclick = () => {
      this._deleteComment(bcfTopic, bcfComment, commentElementId);
    };
    return button;
  }
  _buildEditComment(commentTextElement, comment) {
    const button = document.createElement("button");
    button.textContent = "Edit";
    button.onclick = () => {
      if (commentTextElement.contentEditable === "true") {
        commentTextElement.contentEditable = "false";
        button.textContent = "Edit";
        const textContent = commentTextElement.textContent;
        if (textContent !== null) {
          this._setCommentText(comment, textContent);
        }
      } else {
        commentTextElement.contentEditable = "true";
        button.textContent = "Save";
      }
    };
    return button;
  }
  _buildComment(bcfTopic, bcfComment) {
    const commentElementId = this._getId();
    const viewpoint = this._getViewpointFromComment(bcfTopic, bcfComment);
    if (viewpoint !== null) {
      this._viewpointIdMap.set(commentElementId, viewpoint);
    }
    const commentElement = this._buildDiv(commentElementId, "", "comment");
    const author = `Created by ${bcfComment.getAuthor()}`;
    const date = this._formatDate(bcfComment.getDate());
    const text = bcfComment.getText();
    commentElement.appendChild(this._buildDiv(this._getId(), author));
    commentElement.appendChild(this._buildDiv(this._getId(), date));
    const viewpointGuid = bcfComment.getViewpointGuid();
    if (viewpointGuid !== null) {
      const markup = bcfTopic.getMarkup();
      const markupViewpoints = markup.getViewpoints();
      const markupViewpoint = markupViewpoints.get(viewpointGuid);
      if (markupViewpoint !== void 0) {
        const snapshotFilename = markupViewpoint.getSnapshotFilename();
        if (snapshotFilename !== null) {
          const snapshot = bcfTopic.getSnapshot(snapshotFilename);
          if (snapshot !== null) {
            commentElement.appendChild(this._buildImage(snapshot.getUrl()));
          }
        }
      }
    }
    const commentTextElementId = this._getId();
    this._commentGuidMap.set(bcfComment.getId(), commentTextElementId);
    const commentTextElement = this._buildDiv(commentTextElementId, text);
    commentElement.appendChild(commentTextElement);
    commentElement.appendChild(this._buildEditComment(commentTextElement, bcfComment));
    commentElement.appendChild(this._buildDeleteComment(bcfTopic, bcfComment, commentElementId));
    return commentElement;
  }
  /** @hidden */
  async _addComment(bcfTopic, text) {
    const activeView = this._viewer.markupManager.getActiveMarkupView();
    const bcfComment = await this._addBCFComment(bcfTopic, text, activeView);
    const commentElem = this._buildComment(bcfTopic, bcfComment);
    const commentsElementId = this._topicCommentsGuidMap.get(bcfTopic.getTopicId());
    if (commentsElementId !== void 0) {
      const commentsElem = document.getElementById(commentsElementId);
      if (commentsElem !== null) {
        commentsElem.appendChild(commentElem);
      }
    }
    return bcfComment;
  }
  /** @hidden */
  _deleteComment(bcfTopic, bcfComment, commentElementId) {
    const commentElement = document.getElementById(commentElementId);
    if (commentElement !== null && commentElement.parentElement !== null) {
      commentElement.parentElement.removeChild(commentElement);
      bcfTopic.getMarkup().deleteComment(bcfComment.getId());
      this._refreshScroll();
    }
  }
  _setCommentText(bcfComment, text) {
    const commentId = this._commentGuidMap.get(bcfComment.getId());
    if (commentId !== void 0) {
      const commentElement = document.getElementById(commentId);
      if (commentElement !== null) {
        bcfComment.setText(text);
        commentElement.textContent = text;
        this._refreshScroll();
      }
    }
  }
  _buildAddComment(bcfTopic) {
    const addCommentElem = this._buildDiv(this._getId(), "");
    const textArea = document.createElement("textarea");
    textArea.style.width = "100%";
    addCommentElem.appendChild(textArea);
    const button = document.createElement("button");
    button.textContent = "Add Comment";
    addCommentElem.appendChild(button);
    button.onclick = async () => {
      const text = textArea.value;
      textArea.value = "";
      if (text.length > 0) {
        await this._addComment(bcfTopic, text);
      }
    };
    return addCommentElem;
  }
  _buildTopicData(label, value) {
    const element = document.createElement("div");
    element.classList.add("topic-data");
    if (value !== void 0 && value !== null) {
      element.innerHTML = `<b>${label}</b>: ${value}`;
    } else {
      element.innerHTML = `<b>${label}</b>: -`;
    }
    return element;
  }
  _formatDate(date) {
    if (date === void 0) {
      return "-";
    } else {
      return date.toDateString();
    }
  }
  /** @hidden */
  _deleteTopic(bcfData, bcfTopic) {
    const topicElementId = this._topicGuidMap.get(bcfTopic.getTopicId());
    if (topicElementId !== void 0) {
      const topicElement = document.getElementById(topicElementId);
      if (topicElement !== null && topicElement.parentElement !== null) {
        topicElement.parentElement.removeChild(topicElement);
      }
    }
    return bcfData.getTopics().delete(bcfTopic.getTopicId());
  }
  _buildDeleteTopic(bcfData, bcfTopic) {
    const button = document.createElement("button");
    button.textContent = "Delete Topic";
    button.classList.add("ui-bcf-delete");
    button.onclick = async () => {
      this._deleteTopic(bcfData, bcfTopic);
    };
    return button;
  }
  /** @hidden */
  _setTopicTitle(bcfTopic, topicTitle) {
    const topicElementId = this._topicTitleGuidMap.get(bcfTopic.getTopicId());
    if (topicElementId !== void 0) {
      const topicElement = document.getElementById(topicElementId);
      if (topicElement !== null) {
        topicElement.textContent = topicTitle;
      }
    }
    bcfTopic.getMarkup().setTopicTitle(topicTitle);
  }
  _buildTopic(bcfData, bcfTopic) {
    const topicElementId = this._getId();
    const topicGuid = bcfTopic.getTopicId();
    this._topicGuidMap.set(topicGuid, topicElementId);
    const topicElement = this._buildDiv(topicElementId, "", "ui-bcf-topic");
    const markup = bcfTopic.getMarkup();
    const topicTitle = markup.getTopicTitle();
    const indexAndTitleElement = topicElement.appendChild(
      this._buildDiv(this._getId(), "", "index-and-title")
    );
    const index = markup.getTopicIndex();
    if (index !== null) {
      const indexText = `<b>Index</b>: ${index}`;
      indexAndTitleElement.appendChild(this._buildDiv(this._getId(), indexText, "index"));
    }
    const updateTopicTitle = (topicTitle2) => {
      this._setTopicTitle(bcfTopic, topicTitle2);
    };
    const topicTitleId = this._getId();
    this._topicTitleGuidMap.set(topicGuid, topicTitleId);
    indexAndTitleElement.appendChild(
      this._buildEditDiv(topicTitleId, topicTitle, "Topic Title", updateTopicTitle, "title")
    );
    const viewpoint = bcfTopic.getViewpoint("viewpoint.bcfv");
    if (viewpoint !== null) {
      const bcfViewpointId = this._getId();
      this._viewpointIdMap.set(bcfViewpointId, viewpoint);
      const viewpointElement = this._buildDiv(bcfViewpointId, "", "viewpoint");
      const snapshot = bcfTopic.getSnapshot(viewpoint.getFilename());
      if (snapshot !== null) {
        viewpointElement.appendChild(this._buildImage(snapshot.getUrl()));
      }
      topicElement.appendChild(viewpointElement);
    }
    const topicData = this._buildDiv(this._getId(), "");
    topicData.appendChild(this._buildTopicData("Author", markup.getTopicCreationAuthor()));
    topicData.appendChild(this._buildTopicData("Description", markup.getTopicDescription()));
    topicData.appendChild(
      this._buildTopicData("Created", this._formatDate(markup.getTopicCreationDate()))
    );
    topicData.appendChild(this._buildTopicData("Type", markup.getTopicType()));
    topicData.appendChild(this._buildTopicData("Priority", markup.getTopicPriority()));
    topicData.appendChild(this._buildTopicData("Stage", markup.getTopicStage()));
    topicData.appendChild(this._buildTopicData("TopicId", bcfTopic.getTopicId()));
    topicElement.appendChild(topicData);
    const commentsElementId = this._getId();
    const commentsElement = this._buildDiv(commentsElementId, "");
    this._topicCommentsGuidMap.set(topicGuid, commentsElementId);
    bcfTopic.getMarkup().getComments().forEach((comment) => {
      commentsElement.appendChild(this._buildComment(bcfTopic, comment));
    });
    topicElement.appendChild(commentsElement);
    const commentButtonDiv = this._buildAddComment(bcfTopic);
    commentButtonDiv.appendChild(this._buildDeleteTopic(bcfData, bcfTopic));
    topicElement.appendChild(commentButtonDiv);
    return topicElement;
  }
  _buildSelectOption(label, id) {
    const element = document.createElement("option");
    element.id = this._getSelectId(id);
    element.value = id;
    element.textContent = label;
    return element;
  }
  _appendBCF(id, filename) {
    const bcfManager = this._viewer.BCFManager;
    const bcfData = bcfManager.getBCFData(id);
    if (bcfData === null) {
      return;
    }
    const bcfId = this._getId();
    this._showBCFData(bcfId);
    this._bcfIdMap.set(bcfId, id);
    this._bcfDataList.appendChild(this._buildSelectOption(`${id}. ${filename}`, bcfId));
    this._bcfDataList.value = bcfId;
    const bcfNode = this._buildBCFNode(bcfId);
    this._listRoot.appendChild(bcfNode);
    bcfNode.appendChild(this._buildRemoveBCF(bcfData.getId()));
    bcfNode.appendChild(this._buildAddTopic(bcfData));
    const bcfTopics = bcfData.getTopics();
    bcfTopics.forEach((bcfTopic) => {
      const topicNode = this._buildTopic(bcfData, bcfTopic);
      bcfNode.appendChild(topicNode);
    });
    this._refreshScroll();
  }
  /** @hidden */
  _getBcfHtmlId(id) {
    let bcfId = null;
    this._bcfIdMap.forEach((_id, _bcfHtmlId) => {
      if (id === _id) {
        bcfId = _bcfHtmlId;
      }
    });
    return bcfId;
  }
  _removeBCF(id) {
    const bcfId = this._getBcfHtmlId(id);
    if (bcfId !== null) {
      this._bcfIdMap.delete(bcfId);
      $(`#${bcfId}`).remove();
      $(`#${this._getSelectId(bcfId)}`).remove();
      const bcfDataListValue = this._bcfDataList.value;
      if (bcfDataListValue.length > 0) {
        this._showBCFData(bcfDataListValue);
      }
    }
  }
  _getViewpointFromComment(topic, comment) {
    const viewpointGuid = comment.getViewpointGuid();
    if (viewpointGuid !== null) {
      const markupViewpoints = topic.getMarkup().getViewpoints();
      const markupViewpoint = markupViewpoints.get(viewpointGuid);
      if (markupViewpoint !== void 0) {
        const viewpointFilename = markupViewpoint.getViewpointFilename();
        if (viewpointFilename !== null) {
          return topic.getViewpoint(viewpointFilename);
        }
      }
    }
    return null;
  }
  _getId() {
    return `bcf_${++this._idCount}`;
  }
  _getSelectId(bcfId) {
    return `select_${bcfId}`;
  }
  async _onTreeSelectItem(htmlId) {
    const viewpoint = this._getViewpoint(htmlId);
    if (viewpoint !== null) {
      await viewpoint.activate();
    }
  }
  _getViewpoint(id) {
    return this._viewpointIdMap.get(id) || null;
  }
}
export {
  BCFTree
};
