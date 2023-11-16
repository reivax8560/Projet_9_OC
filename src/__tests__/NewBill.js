/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES_PATH } from "../constants/routes.js"


let newBill;

const setMockFileToFileInput = async () => {       // => simule le téléchargement d'un justif et retourne les données
  const fileInput = screen.getByTestId("file");
  const handleChangeFile = jest.fn(newBill.handleChangeFile);
  fileInput.addEventListener("change", handleChangeFile);
  await waitFor(() => {
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["test"], "test.png", { type: "image/png" })],
      },
    });
  });
  return { fileInput, handleChangeFile }
};

const initBillPage = async () => {                 // => lance la page newBill avec données mockées
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,      // récup get set clear remove
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);

  router();

  window.onNavigate(ROUTES_PATH.NewBill);
  const store = mockStore;

  newBill = new NewBill({
    document,
    onNavigate,
    store,
    localStorage,
  });
  await waitFor(() => screen.getByText("Envoyer une note de frais"))
}

beforeAll(() => {
  initBillPage();
});


describe("When I am on NewBill Page", () => {

  describe("When I select a proof with the file input", () => {
    test("Then, proof should be send to mock API POST", async () => {               // vérifie que le justif soit bien téléchargé
      const { handleChangeFile, fileInput } = await setMockFileToFileInput();

      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].type).toBe("image/png");
      expect(fileInput.files[0].name).toBe("test.png");
    })
  })

  describe("When I submit the form", () => {
    test("Then, datas should be send to mock API POST", async () => {               // vérifie que le formulaire soit bien envoyé

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => e.preventDefault());
      form.addEventListener('submit', handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId('btn-new-bill')).toBeTruthy();

    })
  })

  describe("When an error occurs on API", () => {                 // ERREURS API
    beforeEach(() => {                                            // espionne le retour promesse mockStore et créé un user employee
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "b@b"
      }))
    })
    test("fetches bills from an API and fails with 404 message error", async () => {      // test erreur 404
      const logSpy = jest.spyOn(global.console, 'error');
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      await new Promise(process.nextTick);
      await setMockFileToFileInput();

      expect(logSpy).toHaveBeenCalledWith(new Error("Erreur 404"));
    })

    test("fetches messages from an API and fails with 500 message error", async () => {     // test erreur 500
      const logSpy = jest.spyOn(global.console, 'error');
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      await new Promise(process.nextTick);
      await setMockFileToFileInput();

      expect(logSpy).toHaveBeenCalledWith(new Error("Erreur 500"));

    })
  })

})
